package com.Anto.service;

import com.Anto.exceptions.UserException;
import com.Anto.modal.User;

import java.util.List;

public interface UserService {

    User getUserFromJwtToken(String token) throws UserException;
    User getCurrentUser() throws UserException;
    User getUserByEmail(String email) throws UserException;
    User getUserById(Long id) throws Exception;
    List<User> getAllUsers() ;


    User getUserFromJwttoken(String jwt) throws UserException;
}
