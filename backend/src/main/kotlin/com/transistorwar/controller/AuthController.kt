package com.transistorwar.controller

import com.transistorwar.dto.*
import com.transistorwar.service.AuthService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {

    @PostMapping("/signup")
    fun signUp(@Valid @RequestBody request: SignUpRequest): ResponseEntity<ApiResponse<AuthResponse>> {
        return try {
            val result = authService.signUp(request)
            ResponseEntity.ok(ApiResponse.success(result, "회원가입 성공"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "회원가입 실패"))
        }
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<ApiResponse<AuthResponse>> {
        return try {
            val result = authService.login(request)
            ResponseEntity.ok(ApiResponse.success(result, "로그인 성공"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "로그인 실패"))
        }
    }
}
