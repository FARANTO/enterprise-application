package com.Anto.service;

import com.Anto.exceptions.UserException;
import com.Anto.payload.dto.UserDto;
import com.Anto.payload.response.AuthResponse;

public interface AuthService {

    AuthResponse signup(UserDto userDto) throws UserException;
    AuthResponse login(UserDto userDto) throws UserException;


}
