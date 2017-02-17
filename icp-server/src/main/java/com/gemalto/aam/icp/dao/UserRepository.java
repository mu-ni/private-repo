package com.gemalto.aam.icp.dao;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gemalto.aam.icp.datamodel.User;

public interface UserRepository extends JpaRepository<User, Long>{

	User findByLogin(String login);
	
	User findByUserId(String id);
}
