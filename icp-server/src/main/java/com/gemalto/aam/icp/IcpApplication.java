package com.gemalto.aam.icp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IcpApplication {

	public static void main(String[] args) {
		SpringApplication.run(IcpApplication.class, args);
	}
}
