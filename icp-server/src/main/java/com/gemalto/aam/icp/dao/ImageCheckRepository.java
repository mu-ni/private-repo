package com.gemalto.aam.icp.dao;


import org.springframework.data.jpa.repository.JpaRepository;

import com.gemalto.aam.icp.datamodel.ImageCheck;

public interface ImageCheckRepository extends JpaRepository<ImageCheck, Long>{

//	@Query("select i from ImageCheck i where i.image = ?1")
//	List<ImageCheck> findByImageId(String imageId);
}
