package com.gemalto.aam.icp.bussiness;

import com.gemalto.aam.icp.exception.ImageImportException;

public abstract class AbstractImportActionTemplate {

	public final void execute() throws ImageImportException{
		selectInputFile();
		generateResponseFile();
		processInputFile();
	}
	
	protected abstract void selectInputFile() throws ImageImportException;
	
	protected abstract void processInputFile() throws ImageImportException;
	
	protected abstract void generateResponseFile() throws ImageImportException;
}
