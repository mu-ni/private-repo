package com.gemalto.aam.icp.bussiness;

import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.compress.archivers.ArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveInputStream;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.gemalto.aam.icp.dao.ImagePackageRepository;
import com.gemalto.aam.icp.dao.ImageRepository;
import com.gemalto.aam.icp.datamodel.Image;
import com.gemalto.aam.icp.datamodel.ImagePackage;
import com.gemalto.aam.icp.exception.ImageImportException;

@Component
public class ImageImportAction extends AbstractImportActionTemplate {

	private static final Logger log = LoggerFactory.getLogger(ImageImportAction.class);
	
	@Autowired
	private ImagePackageRepository imagePackageRepository;
	@Autowired
	private ImageRepository imageRepository;
	
	@Value("${input.file.folder}")
	private String inputFileFolder;
	
	@Value("${report.file.folder}")
	private String reportFileFolder;
	
	private final String PROP_SEPERATOR = "!";
	private final SimpleDateFormat FILE_NAME_FORMAT = new SimpleDateFormat("yyyyMMddHHmm");
	private final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	
	private File selectedFile;
	private ImagePackage imagePackage;
	
	/**
	 * Select an image package
	 */
	@Override
	protected void selectInputFile() throws ImageImportException{
		
		clear();
		
		// select file from input file folder
		File inputFolder = new File(inputFileFolder);
		
		if(!inputFolder.exists() || inputFolder.isFile()) {
			throw new ImageImportException("input folder not exists or is not a folder");
		}
		
		File[] inputFiles = inputFolder.listFiles(new FilenameFilter() {
			
			@Override
			public boolean accept(File dir, String name) {
				if(name.toUpperCase().endsWith(".ZIP")) {
					return true;
				} else {
					return false;
				}
			}
		});
		
		if(inputFiles.length == 0) {
			log.warn("No image package found ...");
			throw new ImageImportException("No image package found...");
		}
		
		selectedFile = inputFiles[0];

		log.info("File : " + selectedFile.getAbsolutePath() + " selected...");

		imagePackage = new ImagePackage();
		
		imagePackage.setPackageName(FilenameUtils.getBaseName(selectedFile.getName()));
		imagePackage.setReceivedDate(new Date());
		
		imagePackage = imagePackageRepository.saveAndFlush(imagePackage);
		log.info("image package record saved to database : " + imagePackage.getPackageId());
	}

	/**
	 * Generate response file of image package
	 */
	@Override
	protected void generateResponseFile() throws ImageImportException{
		
		File imgPkgRespFile = new File(getImgPkgRespFilePath());
		
		try {
			
			FileUtils.writeStringToFile(imgPkgRespFile, toImgPkgRespString(imagePackage), Charset.defaultCharset());
			log.info("write to file done.");
		} catch (IOException e) {
			log.error(e.getMessage());
			throw new ImageImportException(e.getMessage());
		}
		
		log.info("generate response file");
	}
	
	/**
	 * Import image package
	 */
	@Override
	protected void processInputFile() throws ImageImportException{
		// process selected input file
		log.info("processing...");
		List<Image> imageList = readImagePackage();
		
		imageList = imageRepository.save(imageList);
		
		if(imageList == null || imageList.isEmpty()) {
			log.error("save image list to database error!!");
			throw new ImageImportException("save image list to database error!!");
		}
		
		log.info("import done.");

		try {
			Files.delete(selectedFile.toPath());
		} catch (IOException e) {
			log.error("error in delete file : " + e.getMessage());
			throw new ImageImportException("image import done, error in delete image package file");
		}
		
		log.info("image package file delete done.");
	}

	private void clear() {
		selectedFile = null;
		imagePackage = null;
	}
	
	private List<Image> readImagePackage() throws ImageImportException{
		List<Image> imageList = new ArrayList<Image>();
		
		try(
			InputStream zipStream = new FileInputStream(selectedFile);
			ZipArchiveInputStream archiveStream = new ZipArchiveInputStream(zipStream);
			DataInputStream dataStream = new DataInputStream(archiveStream);
		) {
			
			ArchiveEntry imageFile = null;
			
			while ((imageFile = archiveStream.getNextEntry()) != null) {
				byte[] content = new byte[(int) imageFile.getSize()];
				dataStream.readFully(content);
				
				Image image = new Image();
				image.setActivationDate(new Date());
				image.setContent(Base64.encodeBase64String(content));
				image.setImageKey(FilenameUtils.getBaseName(imageFile.getName()));
				image.setImagePackage(imagePackage);
				
				imageList.add(image);
				log.info("Image : " + image.getImageKey()+ " added to list, ready to save");
			}
			
		} catch (IOException e) {
			log.error(e.getMessage());
			throw new ImageImportException(e.getMessage());
		}
		
		if(imageList.isEmpty()) {
			throw new ImageImportException("NO image found in image package : " + selectedFile.getAbsolutePath());
		}
		
		return imageList;
	}
	
	private String toImgPkgRespString(ImagePackage imagePackage) {
		return new StringBuffer()
				.append(imagePackage.getPackageName()).append(PROP_SEPERATOR)
				.append(DATE_FORMAT.format(imagePackage.getReceivedDate())).append(PROP_SEPERATOR)
				.toString();
	}
	
	private String getImgPkgRespFilePath() {
		return new StringBuffer()
				.append(reportFileFolder)
				.append("OREI002U")
				.append(FILE_NAME_FORMAT.format(new Date()))
				.append(".TXT")
				.toString();
	}

}
