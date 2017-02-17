//package com.gemalto.aam.icp.service;
//
//import java.util.ArrayList;
//import java.util.Date;
//import java.util.List;
//
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Component;
//
//import com.gemalto.aam.icp.dao.ImageCheckRepository;
//import com.gemalto.aam.icp.dao.ImageRepository;
//import com.gemalto.aam.icp.datamodel.Image;
//import com.gemalto.aam.icp.datamodel.ImageCheck;
//import com.gemalto.aam.icp.datamodel.ImagePackage;
//import com.gemalto.aam.icp.datamodel.User;
//
//@Component
//public class InitTestDataService {
//
//	private static final Logger log = LoggerFactory.getLogger(InitTestDataService.class);
//
//	@Autowired
//	private ImageRepository imageRepository;
//	
//	@Autowired
//	private ImageCheckRepository imageCheckRepository;
//	
//	@Scheduled(cron = "${image.import.job.cron.expression}")
//	public void initTestData(){
//		log.info("Initialize test data");
//		
//		List<Image> imgList = new ArrayList<Image>();
//		List<ImageCheck> imgChkList = new ArrayList<ImageCheck>();
//		int[] statusArray = {255, 15, 31, 0, 1, 16, 17};
//		
//		for(int i: statusArray){
//			Image img = new Image();
//			img.setImageKey(String.format("%-9s", "123456"+i ).replace(' ', '0'));
//			img.setStatus(i);
//			img.setExported(false);
//			img.setActivationDate(new Date());
//			img.setContent("test");
//			
//			ImagePackage ip = new ImagePackage();
//			ip.setPackageId((long) 11);
//			
//			img.setImagePackage(ip);
//			imgList.add(img);
//			
//			String hex = String.format("%02X", i);
//			String status1 = hex.substring(0, 1).toLowerCase();
//			String status2 = hex.substring(1).toLowerCase();
//			
//			if(!status1.equals("f") && !status2.equals("f")){
//				ImageCheck ic1 = new ImageCheck();
//				ic1.setImage(img);
//				ic1.setCheckDate(new Date());
//				ic1.setStatus(status1.equals("0")?0:1);
//				ic1.setRejectReason(status1.equals("0")?"":"reason");
//				
//				User user1 = new User();
//				user1.setUserId((long) 123);
//				ic1.setUser(user1);
//				
//				ImageCheck ic2 = new ImageCheck();
//				ic2.setImage(img);
//				ic2.setCheckDate(new Date());
//				ic2.setStatus(status2.equals("0")?0:1);
//				ic2.setRejectReason(status2.equals("0")?"":"reason");
//				
//				User user2 = new User();
//				user2.setUserId((long) 1);
//				ic2.setUser(user2);
//				
//				imgChkList.add(ic1);
//				imgChkList.add(ic2);
//			}else if(status1.equals("f") && status2.equals("f")){
//				//do nothing
//			}else if(!status1.equals("f") && status2.equals("f")){//1f/2f
//				ImageCheck ic = new ImageCheck();
//				ic.setImage(img);
//				ic.setCheckDate(new Date());
//				ic.setStatus(status1.equals("0")?0:1);
//				ic.setRejectReason(status1.equals("0")?"":"reason");
//				
//				User user = new User();
//				user.setUserId((long) 123);
//				ic.setUser(user);
//				
//				imgChkList.add(ic);
//			}else{
//				//impossible
//			}
//			
//			
//		}
//		
//		imageRepository.save(imgList);
//		imageCheckRepository.save(imgChkList);
//		log.info("Initialize test data done.");
//	}
//}
