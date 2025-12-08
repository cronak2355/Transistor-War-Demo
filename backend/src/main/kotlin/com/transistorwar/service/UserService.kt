package com.transistorwar.service

import com.transistorwar.dto.UserResponse
import com.transistorwar.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository
) {

    fun getUserById(id: Long): UserResponse {
        val user = userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다") }
        return UserResponse.from(user)
    }

    fun getUserByUsername(username: String): UserResponse {
        val user = userRepository.findByUsername(username)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다") }
        return UserResponse.from(user)
    }

    // 랭킹 - 승률 기준
    fun getRankingByWinRate(limit: Int = 10): List<UserResponse> {
        return userRepository.findTopByWinRate(minGames = 5)
            .take(limit)
            .map { UserResponse.from(it) }
    }

    // 랭킹 - 총 승리 수 기준
    fun getRankingByWins(limit: Int = 10): List<UserResponse> {
        return userRepository.findTopByTotalWins()
            .take(limit)
            .map { UserResponse.from(it) }
    }
}
