package com.gemalto.aam.icp.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.gemalto.aam.icp.bussiness.AbstractImportActionTemplate;
import com.gemalto.aam.icp.exception.ImageImportException;

@Component
public class ImageImportJob {

	private static final Logger log = LoggerFactory.getLogger(ImageImportJob.class);
	
	@Autowired
	private AbstractImportActionTemplate imageImportAction;
	
	@Scheduled(cron = "${image.import.job.cron.expression}")
	public void execute() {
		try {
			imageImportAction.execute();
		} catch (ImageImportException e) {
			log.error("image import action error!!!");
		}
		log.info("image import action done.");
	}
	
}
