package com.gemalto.aam.icp.datamodel;

public class ReportDTO {
	
	private String imgKey;
	private Integer chkRst;
	private String chkRstCod;
	
	public String getImgKey() {
		return imgKey;
	}
	public void setImgKey(String imgKey) {
		this.imgKey = imgKey;
	}
	public Integer getChkRst() {
		return chkRst;
	}
	public void setChkRst(Integer chkRst) {
		this.chkRst = chkRst;
	}
	public String getChkRstCod() {
		return chkRstCod;
	}
	public void setChkRstCod(String chkRstCod) {
		this.chkRstCod = chkRstCod;
	}
}
