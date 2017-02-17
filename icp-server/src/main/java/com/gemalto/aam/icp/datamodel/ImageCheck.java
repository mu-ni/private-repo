package com.gemalto.aam.icp.datamodel;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

@Entity
@Table(name = "AAM_IMAGECHECK")
public class ImageCheck {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SQ_IMAGECHECK")
	@SequenceGenerator(name="SQ_IMAGECHECK", sequenceName="SQ_IMAGECHECK", allocationSize=1, initialValue = 1)
	@Column(name = "IMAGECHECKID")
	private Long imageCheckId;
	
	@ManyToOne
	@JoinColumn(name = "IMAGEID", nullable = false)
	private Image image;
	
	@ManyToOne
	@JoinColumn(name = "USERID", nullable = false)
	private User user;
	
	@Column(nullable = false)
	private Integer status;

	@Column(name = "REJECTREASON", columnDefinition = "CLOB", nullable = true)
	@Lob
	private String rejectReason;
	
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
	
	@Column(name = "CHECKDATE", nullable = false)
	private Date checkDate;
	
	public ImageCheck() {
	}

	public Long getImageCheckId() {
		return imageCheckId;
	}

	public void setImageCheckId(Long imageCheckId) {
		this.imageCheckId = imageCheckId;
	}

	public Image getImage() {
		return image;
	}

	public void setImage(Image image) {
		this.image = image;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public Integer getStatus() {
		return status;
	}

	public void setStatus(Integer status) {
		this.status = status;
	}

	public String getRejectReason() {
		return rejectReason;
	}

	public void setRejectReason(String rejectReason) {
		this.rejectReason = rejectReason;
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

	public Date getCheckDate() {
		return checkDate;
	}

	public void setCheckDate(Date checkDate) {
		this.checkDate = checkDate;
	}
	
}
