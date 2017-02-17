package com.gemalto.aam.icp.dao;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gemalto.aam.icp.datamodel.ImagePackage;

public interface ImagePackageRepository extends JpaRepository<ImagePackage, Long>{

}
