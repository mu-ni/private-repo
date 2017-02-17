package com.gemalto.aam.icp.controller;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpSession;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.gemalto.aam.icp.dao.ImageCheckRepository;
import com.gemalto.aam.icp.dao.ImageRepository;
import com.gemalto.aam.icp.dao.UserRepository;
import com.gemalto.aam.icp.datamodel.CheckRstDTO;
import com.gemalto.aam.icp.datamodel.Image;
import com.gemalto.aam.icp.datamodel.ImageCheck;
import com.gemalto.aam.icp.datamodel.SigninDTO;
import com.gemalto.aam.icp.datamodel.User;

@Controller
public class MainController {

	private static final Logger logger = LoggerFactory.getLogger(MainController.class);
	private String currentUserName = null;
	private static final int PAGE_SIZE = 10;

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ImageRepository imageRepository;
	@Autowired
	private ImageCheckRepository imageCheckRepository;
	@Autowired
	private HttpSession httpSession;

	@GetMapping("/")
	public String signin() {
		return "redirect:/signin";
	}

	@GetMapping("/signin")
	public String signin(Model model) {
		httpSession.removeAttribute("user");

		model.addAttribute("error", false);
		model.addAttribute("signin", new SigninDTO());
		return "signin";
	}

	@PostMapping("/signin")
	public String signinPost(@ModelAttribute("signin") SigninDTO signin, Model model) {
		httpSession.setMaxInactiveInterval(5 * 60);// 5min

		logger.info("Username : " + signin.getInputUsername());
		logger.info("Password : " + signin.getInputPassword());
		User user = userRepository.findByLogin(signin.getInputUsername());
		
		if (user != null && user.getPassword().equals(signin.getInputPassword())) {
			
			logger.info("User " + signin.getInputUsername() + " signin success!");
			httpSession.setAttribute("user", signin.getInputUsername());
			currentUserName = (String) httpSession.getAttribute("user");
			return "redirect:/main";
		} else {
			
			logger.info("User " + signin.getInputUsername() + " signin failed!");
			model.addAttribute("error", true);
			return "signin";
		}
	}

	@GetMapping("/main")
	public String main(Model model) {
		if (httpSession.getAttribute("user") == null) {
			return "redirect:/signin";
		}

		logger.info("Searching image lists...");
		List<Image> reviewList = imageRepository.findToBeReviewedImages(userRepository.findByLogin(currentUserName).getUserId());
		List<Image> checkList = imageRepository.findByStatus(255);
		//Page<Image> checkList = imageRepository.findAll(new PageRequest(1, PAGE_SIZE));
		Page<Image> reviewListPg = imageRepository.findToBeReviewedImages(
				new PageRequest(0, PAGE_SIZE, Sort.Direction.ASC, "activationDate"),
				userRepository.findByLogin(currentUserName).getUserId());
		Page<Image> checkListPg = imageRepository
				.findByStatus(new PageRequest(0, PAGE_SIZE, Sort.Direction.ASC, "activationDate"), 255);
		
		logger.info("Review list size = " + reviewList.size());
		logger.info("Check list size = " + checkList.size());
		
		int reviewMaxPg = reviewList.size() % PAGE_SIZE == 0 ? reviewList.size() / PAGE_SIZE : reviewList.size() / PAGE_SIZE +1;
		int checkMaxPg = checkList.size() % PAGE_SIZE == 0 ? checkList.size() / PAGE_SIZE : checkList.size() / PAGE_SIZE +1;
		
		model.addAttribute("reviewList", reviewListPg);
		model.addAttribute("reviewMaxPg", reviewMaxPg);
		model.addAttribute("checkList", checkListPg);
		model.addAttribute("checkMaxPg", checkMaxPg);
		
		return "main";
	}

	@GetMapping("/review")
	public String review(@RequestParam(value = "imgid", required = true) String imgid, Model model) {
		if (httpSession.getAttribute("user") == null) {
			return "redirect:/signin";
		}

		logger.info("Current image id = " + imgid);
		model.addAttribute("imgBase64", imageRepository.findByImageId(Long.parseLong(imgid)).getContent());
		
		return "check";
	}

	@PostMapping("/review")
	@Transactional
	public String reviewPost(@ModelAttribute("checkRst") CheckRstDTO checkRst,
			@RequestParam(value = "imgid", required = true) String imgid,
			@RequestParam(value = "action", required = true) String action, Model model) {
		if (httpSession.getAttribute("user") == null) {
			return "redirect:/signin";
		}
		
		logger.info("Reviewing the image, imgid = " + imgid);

		ImageCheck imgchk = new ImageCheck();
		imgchk.setCheckDate(new Date());
		int currentStatus = imageRepository.findByImageId(Long.parseLong(imgid)).getStatus();
		
		logger.info("Image id = " + imgid + ". The current status = " + currentStatus);

		if (action.equals("pass")) {
			
			logger.info("Review result is OK");
			
			imgchk.setStatus(0);
			int status = currentStatus == 15 ? 0 : 16;
			logger.info("Updating image id = " + imgid + ". New status = " + status);
			
			imageRepository.updateImageStatus(Long.parseLong(imgid), status, new Date());
			logger.info("Image id = " + imgid + " updated.");
			
		} else if (action.equals("npass")) {
			
			logger.info("Review result is NOK");
			
			imgchk.setStatus(1);
			imgchk.setRejectReason(checkRst.getReason());
			logger.info("Reject reason : " + checkRst.getReason());
			
			int status = currentStatus == 15 ? 1 : 17;
			logger.info("Updating image id = " + imgid + ". New status = " + status);
			
			imageRepository.updateImageStatus(Long.parseLong(imgid), status, new Date());
			logger.info("Image id = " + imgid + " updated.");
			
		} else {
			logger.error("Action : " + action);
		}

		imgchk.setImage(imageRepository.findByImageId(Long.parseLong(imgid)));
		imgchk.setUser(userRepository.findByLogin(currentUserName));

		imageCheckRepository.save(imgchk);
		logger.info("ImageCheck id= " + imgchk.getImageCheckId() + " saved.");

		logger.info("Searching the next image to be reviewed...");
		List<Image> reviewList = imageRepository
				.findToBeReviewedImages(userRepository.findByLogin(currentUserName).getUserId());

		Long nextid = (long) 0;
		for (Image img : reviewList) {
			if (img.getImageId() != Long.parseLong(imgid)) {
				nextid = img.getImageId();
				logger.info("Next image to be reviewed exists! nextid = " + nextid);
				break;
			}
		}

		if (nextid == 0) {
			logger.info("It is already the last image!");
			return "redirect:/main";
		} else {
			model.addAttribute("operation", "review");
			return "redirect:/review?imgid=" + nextid;
		}

	}

	@GetMapping("/check")
	public String check(@RequestParam(value = "imgid", required = true) String imgid, Model model) {
		if (httpSession.getAttribute("user") == null) {
			return "redirect:/signin";
		}

		logger.info("Current image id = " + imgid);
		model.addAttribute("imgBase64", imageRepository.findByImageId(Long.parseLong(imgid)).getContent());
		
		return "check";
	}

	@PostMapping("/check")
	@Transactional
	public String checkPost(@ModelAttribute("checkRst") CheckRstDTO checkRst,
			@RequestParam(value = "imgid", required = true) String imgid,
			@RequestParam(value = "action", required = true) String action, Model model) {
		if (httpSession.getAttribute("user") == null) {
			return "redirect:/signin";
		}
		
		logger.info("Checking the image, imgid = " + imgid);

		ImageCheck imgchk = new ImageCheck();
		imgchk.setCheckDate(new Date());

		if (action.equals("pass")) {
			
			logger.info("Check result is OK");
			
			imgchk.setStatus(0);
			
			logger.info("Updating image id = " + imgid + ". New status = " + 15);
			imageRepository.updateImageStatus(Long.parseLong(imgid), 15, new Date());
			logger.info("Image id = " + imgid + " updated.");
			
		} else if (action.equals("npass")) {
			
			logger.info("Check result is NOK");
			
			imgchk.setStatus(1);
			imgchk.setRejectReason(checkRst.getReason());
			logger.info("Reject reason : " + checkRst.getReason());
			
			logger.info("Updating image id = " + imgid + ". New status = " + 31);
			imageRepository.updateImageStatus(Long.parseLong(imgid), 31, new Date());
			logger.info("Image id = " + imgid + " updated.");
			
		} else {
			logger.error("Action : " + action);
		}

		imgchk.setImage(imageRepository.findByImageId(Long.parseLong(imgid)));
		imgchk.setUser(userRepository.findByLogin(currentUserName));

		imageCheckRepository.save(imgchk);
		logger.info("ImageCheck id= " + imgchk.getImageCheckId() + " saved.");

		logger.info("Searching the next image to be checked...");
		Long nextid = (long) 0;
		for (Image img : imageRepository.findByStatus(255)) {
			if (img.getImageId() != Long.parseLong(imgid)) {
				nextid = img.getImageId();
				logger.info("Next image to be checked exists! nextid = " + nextid);
				break;
			}
		}

		if (nextid == 0) {
			logger.info("It is already the last image!");
			return "redirect:/main";
		} else {
			model.addAttribute("operation", "review");
			return "redirect:/check?imgid=" + nextid;
		}

	}
	
	@PostMapping("/pageFlip")
	public  @ResponseBody String pageFlip(@RequestBody(required = true) String reqBody) {

		logger.info("POST /pageFlip. Request body: " + reqBody.toString());
		
		try {
			
			JSONObject req = new JSONObject(reqBody);
			List<Image> imgList = new ArrayList<Image>();
			int maxPage = 0;
			
			String list = (String) req.get("list");
			int pageTo = Integer.valueOf((String) req.get("pageTo"));
			
			if(list.equals("review")){			
				imgList = imageRepository
						.findToBeReviewedImages(new PageRequest(pageTo-1, PAGE_SIZE, Sort.Direction.ASC, "activationDate"),
								userRepository.findByLogin(currentUserName).getUserId())
						.getContent();
				List<Image> reviewList = imageRepository.findToBeReviewedImages(userRepository.findByLogin(currentUserName).getUserId());
				maxPage = reviewList.size() % PAGE_SIZE == 0 ? reviewList.size() / PAGE_SIZE : reviewList.size() / PAGE_SIZE +1;
			}else if(list.equals("check")){
				imgList = imageRepository.findByStatus(new PageRequest(pageTo-1, PAGE_SIZE, Sort.Direction.ASC, "activationDate"), 255).getContent();
				List<Image> checkList = imageRepository.findByStatus(255);
				maxPage = checkList.size() % PAGE_SIZE == 0 ? checkList.size() / PAGE_SIZE : checkList.size() / PAGE_SIZE +1;
			}else{
				logger.error("LIST = " + list + ". Not supported!");
			}
			
			logger.info("Generating response body...");
			JSONArray jArray = new JSONArray();
			
			for(Image img : imgList){
				JSONObject imgJson = new JSONObject();
				
				imgJson.put("packageId", img.getImagePackage().getPackageId());
				imgJson.put("imgKey", img.getImageKey());
				imgJson.put("activationDate", new SimpleDateFormat("yyyy-MM-dd").format(img.getActivationDate()));
				jArray.put(imgJson);
			}
			
			logger.info("Response body generated!");
			//System.out.println(new JSONObject("{'maxPage':"+ maxPage +",'imgList':"+ jArray +"}").toString());
			
			return new JSONObject("{'maxPage':"+ maxPage +",'imgList':"+ jArray +"}").toString();
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			logger.error(e.getMessage());
			e.printStackTrace();
		}
		
		return null;
	}

}
