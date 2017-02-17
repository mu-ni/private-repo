package com.gemalto.aam.icp.service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.gemalto.aam.icp.dao.ImageRepository;
import com.gemalto.aam.icp.datamodel.Image;
import com.gemalto.aam.icp.datamodel.ReportDTO;

@Component
public class GenerateReportService {

	private static final Logger logger = LoggerFactory.getLogger(GenerateReportService.class);
	
	@Autowired
	private ImageRepository imageRepository;

	@Value("${report.file.folder}")
	private String reportFileFolder;
	
	@Scheduled(cron = "${image.import.job.cron.expression}")
	@Transactional
	public void generateReport(){
		logger.info("Generating report...");
		
		List<Image> imageList = imageRepository.findAllReviewedImages();
		logger.info("Reviewed image list size = " + imageList.size());
		
		List<ReportDTO> reportList = new ArrayList<ReportDTO>();
		
		if(imageList.size() == 0){
			logger.info("No new data found.");
			return;
		}

		for(Image img : imageList){
			ReportDTO report = new ReportDTO();
			
			report.setImgKey(img.getImageKey());
			report.setChkRst(img.getStatus());
			
			List<String> reasonCode = new ArrayList<String>();
			img.getImageChecks().forEach((imageCheck) -> {
				logger.info("REASON: " + imageCheck.getRejectReason());
				reasonCode.add(imageCheck.getRejectReason()==null?"":imageCheck.getRejectReason());
			});
			
			report.setChkRstCod(reasonCode.toString().replace("[", "").replace("]", "").trim());
			reportList.add(report);
		}
		
		File reportFolder = new File(reportFileFolder);
		if (!reportFolder.exists()) {
			logger.info(reportFileFolder +" not exists!");
			return;
		}
		
		try {
			String reportName = reportFileFolder + "OREI002U" + new SimpleDateFormat("yyyyMMddHHmm").format(new Date()) + ".txt";
			File fout = new File(reportName);
			FileOutputStream fos = new FileOutputStream(fout);
		 
			BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(fos));
			//bw.write("IMG_KEY, CHK_RST, CHK_RST_COD");
			
			logger.info("Report list size = " + reportList.size());
			for (ReportDTO report : reportList) {
				int status = report.getChkRst() == 0?0:1;
				String data = report.getImgKey() + "!" + status + "!" + report.getChkRstCod()+"!";
				logger.info(data);
				
				bw.write(data);
				bw.newLine();
			}
		 
			bw.close();
			logger.info("Export report success! Path: " + reportName);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			logger.error(e.getMessage());
			e.printStackTrace();
		}
		
		logger.info("Updating database");
		imageRepository.updateImageIsExported();
		logger.info("Database updated.");
		
	}
}
