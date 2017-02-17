package com.gemalto.aam.icp.datamodel;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

@Entity
@Table(name = "AAM_IMAGEPACKAGE")
public class ImagePackage {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SQ_IMAGEPACKAGE")
	@SequenceGenerator(name="SQ_IMAGEPACKAGE", sequenceName="SQ_IMAGEPACKAGE", allocationSize=1, initialValue = 1)
	@Column(name = "PACKAGEID")
	private Long packageId;
	
	@Column(name = "PACKAGENAME", nullable = false)
	private String packageName;
	
	@Column(name = "RECEIVEDDATE", nullable = false)
	private Date receivedDate;
	
	@Column(columnDefinition = "CLOB")
	@Lob
	private String custom1;
	
	@Column(columnDefinition = "CLOB")
	@Lob
	private String custom2;
	
	@Column(columnDefinition = "CLOB")
	@Lob
	private String custom3;
	
	@Column(columnDefinition = "CLOB")
	@Lob
	private String custom4;
	
	@Column(columnDefinition = "CLOB")
	@Lob
	private String custom5;
	
	@OneToMany(fetch = FetchType.EAGER)
	@JoinColumn(name = "PACKAGEID")
	@OrderBy("IMAGEID")
	private List<Image> images = new ArrayList<Image>();
	
	public ImagePackage() {
	}

	public Long getPackageId() {
		return packageId;
	}

	public void setPackageId(Long packageId) {
		this.packageId = packageId;
	}

	public String getPackageName() {
		return packageName;
	}

	public void setPackageName(String packageName) {
		this.packageName = packageName;
	}

	public Date getReceivedDate() {
		return receivedDate;
	}

	public void setReceivedDate(Date receivedDate) {
		this.receivedDate = receivedDate;
	}

	public String getCustom1() {
		return custom1;
	}

	public void setCustom1(String custom1) {
		this.custom1 = custom1;
	}

	public String getCustom2() {
		return custom2;
	}

	public void setCustom2(String custom2) {
		this.custom2 = custom2;
	}

	public String getCustom3() {
		return custom3;
	}

	public void setCustom3(String custom3) {
		this.custom3 = custom3;
	}

	public String getCustom4() {
		return custom4;
	}

	public void setCustom4(String custom4) {
		this.custom4 = custom4;
	}

	public String getCustom5() {
		return custom5;
	}

	public void setCustom5(String custom5) {
		this.custom5 = custom5;
	}

	public List<Image> getImages() {
		return images;
	}

	public void setImages(List<Image> images) {
		this.images = images;
	}
	
}
