package com.Anto.controller;


import com.Anto.exceptions.UserException;
import com.Anto.mapper.UserMapper;
import com.Anto.modal.User;
import com.Anto.payload.dto.UserDto;
import com.Anto.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;



    @GetMapping("/profile")
    public ResponseEntity<UserDto> getUserProfile(
        @RequestHeader("Authorization") String jwt
    ) throws UserException {
       User user= userService.getUserFromJwtToken(jwt);
       return ResponseEntity.ok(UserMapper.toDTO(user));
    }



    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserBy(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long id
    ) throws UserException, Exception {
        User user= userService.getUserById(id);
        return ResponseEntity.ok(UserMapper.toDTO(user));
    }

}
