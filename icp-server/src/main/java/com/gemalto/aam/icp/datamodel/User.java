package com.gemalto.aam.icp.datamodel;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

@Entity
@Table(name = "AAM_USER")
public class User {

	// Do not use 'user' or 'USER' or 'SQ_USER' as column name or sequence name
	// otherwise Hibernate will NOT work
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SQ_AAMUSER")
	@SequenceGenerator(name="SQ_AAMUSER", sequenceName="SQ_AAMUSER", allocationSize=1, initialValue = 1)
	@Column(name = "USERID")
	private Long userId;
	
	@Column(nullable = false)
	private String login;
	
	@Column(nullable = false)
	private String password;

	@Column(name = "PASSWORDSALT")
	private String passwordSalt;
	
	@Column(columnDefinition = "CLOB")
	@Lob
	private String description;
	
	@Column(name = "USERTYPE")
	private String userType;
	
	@Column(name = "ACTIVATIONDATE", nullable = false)
	private Date activationDate;
	
	@Column(name = "ISACTIVE", nullable = false)
	private Integer active;
	
	@Column(name = "PASSWORDTRYCOUNTER")
	private Integer passwordTryCounter;
	
	@Column(name = "PASSWORDDECLARATIONDATE", nullable = false)
	private Date passwordDeclarationDate;
	
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
	
	public User() {
		this.passwordTryCounter = 5;
		this.userType = "USER_HUMAN";
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getLogin() {
		return login;
	}

	public void setLogin(String login) {
		this.login = login;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getPasswordSalt() {
		return passwordSalt;
	}

	public void setPasswordSalt(String passwordSalt) {
		this.passwordSalt = passwordSalt;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getUserType() {
		return userType;
	}

	public void setUserType(String userType) {
		this.userType = userType;
	}

	public Date getActivationDate() {
		return activationDate;
	}

	public void setActivationDate(Date activationDate) {
		this.activationDate = activationDate;
	}

	public boolean isActive() {
		return active == 1;
	}

	public void setActive(boolean active) {
		this.active = active ? 1 : 0;
	}

	public Integer getPasswordTryCounter() {
		return passwordTryCounter;
	}

	public void setPasswordTryCounter(Integer passwordTryCounter) {
		this.passwordTryCounter = passwordTryCounter;
	}

	public Date getPasswordDeclarationDate() {
		return passwordDeclarationDate;
	}

	public void setPasswordDeclarationDate(Date passwordDeclarationDate) {
		this.passwordDeclarationDate = passwordDeclarationDate;
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

}
