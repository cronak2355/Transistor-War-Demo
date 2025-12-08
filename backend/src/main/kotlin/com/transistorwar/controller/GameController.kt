package com.transistorwar.controller

import com.transistorwar.dto.ApiResponse
import com.transistorwar.dto.GameRecordResponse
import com.transistorwar.dto.GameResultRequest
import com.transistorwar.security.UserPrincipal
import com.transistorwar.service.GameService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/games")
class GameController(
    private val gameService: GameService
) {

    // AI 게임 결과 저장
    @PostMapping("/result")
    fun saveGameResult(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: GameResultRequest
    ): ResponseEntity<ApiResponse<GameRecordResponse>> {
        return try {
            val result = gameService.saveAiGameResult(principal.id, request)
            ResponseEntity.ok(ApiResponse.success(result, "게임 결과 저장 완료"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "저장 실패"))
        }
    }

    // 내 게임 기록 조회
    @GetMapping("/history")
    fun getMyGameHistory(
        @AuthenticationPrincipal principal: UserPrincipal
    ): ResponseEntity<ApiResponse<List<GameRecordResponse>>> {
        val history = gameService.getGameHistory(principal.id)
        return ResponseEntity.ok(ApiResponse.success(history))
    }

    // 최근 게임 기록 조회
    @GetMapping("/recent")
    fun getRecentGames(
        @AuthenticationPrincipal principal: UserPrincipal,
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<ApiResponse<List<GameRecordResponse>>> {
        val games = gameService.getRecentGames(principal.id, limit)
        return ResponseEntity.ok(ApiResponse.success(games))
    }
}
