package com.Anto.controller;

import com.Anto.exceptions.UserException;
import com.Anto.payload.dto.UserDto;
import com.Anto.payload.response.AuthResponse;
import com.Anto.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;






    @PostMapping("/signup")

    public ResponseEntity<AuthResponse> signupHandler(
            @RequestBody UserDto userDto
    ) throws UserException {
        return  ResponseEntity.ok(authService.signup(userDto)  );

    }


    @PostMapping("/login")

    public ResponseEntity<AuthResponse> loginHandler(
            @RequestBody UserDto userDto
    ) throws UserException {
        return  ResponseEntity.ok(authService.login(userDto)  );

    }




}
