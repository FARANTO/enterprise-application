package com.Anto.payload.dto;

import com.Anto.domain.StoreStatus;
import com.Anto.modal.StoreContact;
import com.Anto.modal.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StoreDTO {

    private Long id;


    private String name;

    private String brand;


    private UserDto storeAdmin;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String description;

    private String storeType;

    private StoreStatus status;

    private StoreContact contact = new StoreContact();

}
