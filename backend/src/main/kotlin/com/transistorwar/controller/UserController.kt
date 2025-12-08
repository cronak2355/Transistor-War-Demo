package com.transistorwar.controller

import com.transistorwar.dto.ApiResponse
import com.transistorwar.dto.UserResponse
import com.transistorwar.security.UserPrincipal
import com.transistorwar.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    // 내 정보 조회
    @GetMapping("/me")
    fun getMyInfo(@AuthenticationPrincipal principal: UserPrincipal): ResponseEntity<ApiResponse<UserResponse>> {
        val user = userService.getUserById(principal.id)
        return ResponseEntity.ok(ApiResponse.success(user))
    }

    // 특정 사용자 정보 조회
    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): ResponseEntity<ApiResponse<UserResponse>> {
        return try {
            val user = userService.getUserById(id)
            ResponseEntity.ok(ApiResponse.success(user))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "사용자를 찾을 수 없습니다"))
        }
    }
}

@RestController
@RequestMapping("/api/ranking")
class RankingController(
    private val userService: UserService
) {

    // 승률 랭킹
    @GetMapping("/winrate")
    fun getRankingByWinRate(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<ApiResponse<List<UserResponse>>> {
        val ranking = userService.getRankingByWinRate(limit)
        return ResponseEntity.ok(ApiResponse.success(ranking))
    }

    // 승리 수 랭킹
    @GetMapping("/wins")
    fun getRankingByWins(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<ApiResponse<List<UserResponse>>> {
        val ranking = userService.getRankingByWins(limit)
        return ResponseEntity.ok(ApiResponse.success(ranking))
    }
}
