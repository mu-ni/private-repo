package com.gemalto.aam.icp.datamodel;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

@Entity
@Table(name = "AAM_IMAGE")
public class Image {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SQ_IMAGE")
	@SequenceGenerator(name="SQ_IMAGE", sequenceName="SQ_IMAGE", allocationSize=1, initialValue = 1)
	@Column(name = "IMAGEID")
	private Long imageId;
	
	@Column(name = "IMAGEKEY", nullable = false)
	private String imageKey;
	
	@Column(nullable = false)
	private Integer status;
	
	@ManyToOne
	@JoinColumn(name = "PACKAGEID", nullable = false)
	private ImagePackage imagePackage;
	
	@Column(columnDefinition = "CLOB", nullable = false)
	@Lob
	private String content;
	
	@Column(name = "ACTIVATIONDATE", nullable = false)
	private Date activationDate;
	
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
	
	@Column(name = "LASTUPDATEDATE")
	private Date lastUpdateDate;
	
	@Column(name = "ISEXPORTED", nullable = false)
	private Integer exported;
	
	@OneToMany(fetch = FetchType.EAGER)
	@JoinColumn(name = "IMAGEID")
	@OrderBy("IMAGECHECKID")
	private Set<ImageCheck> imageChecks = new HashSet<ImageCheck>();
	
	public Image() {
		this.status = 0xFF;
		this.exported = 0;
	}

	public Long getImageId() {
		return imageId;
	}

	public void setImageId(Long imageId) {
		this.imageId = imageId;
	}

	public String getImageKey() {
		return imageKey;
	}

	public void setImageKey(String imageKey) {
		this.imageKey = imageKey;
	}

	public ImagePackage getImagePackage() {
		return imagePackage;
	}

	public void setImagePackage(ImagePackage imagePackage) {
		this.imagePackage = imagePackage;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public Date getActivationDate() {
		return activationDate;
	}

	public void setActivationDate(Date activationDate) {
		this.activationDate = activationDate;
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

	public Date getLastUpdateDate() {
		return lastUpdateDate;
	}

	public void setLastUpdateDate(Date lastUpdateDate) {
		this.lastUpdateDate = lastUpdateDate;
	}

	public Set<ImageCheck> getImageChecks() {
		return imageChecks;
	}

	public void setImageChecks(Set<ImageCheck> imageChecks) {
		this.imageChecks = imageChecks;
	}

	public Integer getStatus() {
		return status;
	}

	public void setStatus(Integer status) {
		this.status = status;
	}

	public boolean isExported() {
		return exported == 1;
	}

	public void setExported(boolean exported) {
		this.exported = exported ? 1 : 0;
	}
	
}
