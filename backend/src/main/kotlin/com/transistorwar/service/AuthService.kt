package com.transistorwar.service

import com.transistorwar.dto.AuthResponse
import com.transistorwar.dto.LoginRequest
import com.transistorwar.dto.SignUpRequest
import com.transistorwar.dto.UserResponse
import com.transistorwar.entity.User
import com.transistorwar.repository.UserRepository
import com.transistorwar.security.JwtTokenProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider
) {

    fun signUp(request: SignUpRequest): AuthResponse {
        // 중복 체크
        if (userRepository.existsByUsername(request.username)) {
            throw IllegalArgumentException("이미 존재하는 아이디입니다")
        }

        // 사용자 생성
        val user = User(
            username = request.username,
            password = passwordEncoder.encode(request.password)
        )
        val savedUser = userRepository.save(user)

        // 토큰 생성
        val token = jwtTokenProvider.createToken(savedUser.id, savedUser.username)

        return AuthResponse(
            token = token,
            user = UserResponse.from(savedUser)
        )
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = userRepository.findByUsername(request.username)
            .orElseThrow { IllegalArgumentException("아이디 또는 비밀번호가 틀렸습니다") }

        if (!passwordEncoder.matches(request.password, user.password)) {
            throw IllegalArgumentException("아이디 또는 비밀번호가 틀렸습니다")
        }

        // 마지막 로그인 시간 업데이트
        user.lastLoginAt = LocalDateTime.now()
        userRepository.save(user)

        // 토큰 생성
        val token = jwtTokenProvider.createToken(user.id, user.username)

        return AuthResponse(
            token = token,
            user = UserResponse.from(user)
        )
    }
}
