package com.webrtc.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.webrtc.dto.AuthRequest;
import com.webrtc.dto.AuthResponse;
import com.webrtc.dto.RegisterRequest;
import com.webrtc.entity.Tenant;
import com.webrtc.entity.User;
import com.webrtc.repository.TenantRepository;
import com.webrtc.repository.UserRepository;
import com.webrtc.service.JwtService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TenantRepository tenantRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        if (authentication.isAuthenticated()) {
            org.springframework.security.core.userdetails.UserDetails userDetails = 
                (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
            
            String token = jwtService.generateToken(((UserDetails) authentication.getPrincipal()).getUsername());            return ResponseEntity.ok(new AuthResponse(token, authRequest.getUsername()));
        } else {
            throw new UsernameNotFoundException("Invalid user request!");
        }
    }

    // create new user
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest registerRequest) {
        // Check if user already exists
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        // Find or create the tenant
        Tenant tenant = tenantRepository.findByName(registerRequest.getTenantName())
                .orElseGet(() -> {
                    Tenant newTenant = new Tenant();
                    newTenant.setName(registerRequest.getTenantName());
                    return tenantRepository.save(newTenant);
                });

        //  Create a new user
        User newUser = new User();
        newUser.setUsername(registerRequest.getUsername());
        newUser.setEmail(registerRequest.getEmail());
        // Hash the password before saving
        newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        newUser.setTenant(tenant);

        // Save the user to the database
        userRepository.save(newUser);

        return ResponseEntity.ok("User registered successfully!");
    }
}