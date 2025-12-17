package com.webrtc.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.webrtc.entity.Tenant;

public interface TenantRepository extends JpaRepository<Tenant, Long>{
	
	Optional<Tenant> findByName(String name);
	

}
