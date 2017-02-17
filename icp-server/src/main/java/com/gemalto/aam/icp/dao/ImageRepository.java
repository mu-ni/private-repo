package com.gemalto.aam.icp.dao;

import java.util.Date;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import com.gemalto.aam.icp.datamodel.Image;


public interface ImageRepository extends JpaRepository<Image, Long>{

	@Query("select i from Image as i where i.exported = 0 and (i.status = '0' or i.status = '1'or i.status = '16'or i.status = '17')")
	List<Image> findAllReviewedImages();
	
	@Query("select i from Image as i left join i.imageChecks as checks where (i.status = '15' or i.status = '31') and checks.user.userId != ?1")
	List<Image> findToBeReviewedImages(Long userId);
	
	@Query("select i from Image as i left join i.imageChecks as checks where (i.status = '15' or i.status = '31') and checks.user.userId != ?1")
	Page<Image> findToBeReviewedImages(Pageable pageable, Long userId);
	
	@Modifying
	@Transactional
	@Query("update Image i set i.exported = 1 where i.status = '0' or i.status = '1'or i.status = '16'or i.status = '17'")
	void updateImageIsExported();
	
	@Modifying
	@Transactional
	@Query("update Image i set i.status = ?2, i.lastUpdateDate = ?3 where i.imageId = ?1")
	void updateImageStatus(Long imgId, int status, Date now);
	
	List<Image> findByStatus(int status);
	
	Image findByImageId(Long imgId);
	
	//Page<Image> findAll(Pageable pageable);
	Page<Image> findByStatus(Pageable pageable, int status);
	
}
