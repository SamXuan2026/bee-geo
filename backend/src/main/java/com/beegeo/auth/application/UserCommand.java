package com.beegeo.auth.application;

public record UserCommand(String name, String account, String roleCode, String status) {
}
