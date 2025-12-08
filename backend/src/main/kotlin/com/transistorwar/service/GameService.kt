package com.transistorwar.service

import com.transistorwar.dto.GameRecordResponse
import com.transistorwar.dto.GameResultRequest
import com.transistorwar.entity.GameRecord
import com.transistorwar.repository.GameRecordRepository
import com.transistorwar.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class GameService(
    private val userRepository: UserRepository,
    private val gameRecordRepository: GameRecordRepository
) {

    // AI 게임 결과 저장
    fun saveAiGameResult(userId: Long, request: GameResultRequest): GameRecordResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다") }

        // 유저 전적 업데이트
        user.recordGame(request.faction, request.isWin)
        userRepository.save(user)

        // 게임 기록 저장
        val record = GameRecord(
            player = user,
            playerFaction = request.faction,
            opponentFaction = if (request.faction == "legacy") "modern" else "legacy",
            isWin = request.isWin,
            isAiGame = true,
            gameDurationSeconds = request.gameDurationSeconds
        )
        val savedRecord = gameRecordRepository.save(record)

        return GameRecordResponse.from(savedRecord)
    }

    // 게임 기록 조회
    @Transactional(readOnly = true)
    fun getGameHistory(userId: Long): List<GameRecordResponse> {
        return gameRecordRepository.findByPlayerIdOrderByPlayedAtDesc(userId)
            .map { GameRecordResponse.from(it) }
    }

    // 최근 게임 기록 조회
    @Transactional(readOnly = true)
    fun getRecentGames(userId: Long, limit: Int = 10): List<GameRecordResponse> {
        return gameRecordRepository.findRecentByPlayerId(userId)
            .take(limit)
            .map { GameRecordResponse.from(it) }
    }
}
