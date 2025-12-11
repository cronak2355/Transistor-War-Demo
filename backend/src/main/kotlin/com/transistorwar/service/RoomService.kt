package com.transistorwar.service

import com.transistorwar.dto.CreateRoomRequest
import com.transistorwar.dto.RoomResponse
import com.transistorwar.entity.GameRoom
import com.transistorwar.entity.RoomStatus
import com.transistorwar.repository.GameRoomRepository
import com.transistorwar.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional
class RoomService(
    private val roomRepository: GameRoomRepository,
    private val userRepository: UserRepository
) {

    // 방 생성
    fun createRoom(userId: Long, request: CreateRoomRequest): RoomResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다") }

    // 이미 방에 있으면 먼저 나가기
        val existingRoom = roomRepository.findByUserInRoom(userId)
        if (existingRoom.isPresent) {
            val room = existingRoom.get()
            if (room.host.id == userId) {
                // 호스트면 방 삭제
                roomRepository.delete(room)
            } else {
                // 게스트면 나가기만
                room.guest = null
                room.guestFaction = null
                roomRepository.save(room)
            }
        }

        // 방 코드 생성 (8자리 랜덤)
        val roomCode = generateRoomCode()

        val room = GameRoom(
            roomCode = roomCode,
            host = user,
            hostFaction = request.faction
        )
        val savedRoom = roomRepository.save(room)

        return RoomResponse.from(savedRoom)
    }

    // 방 참가
    fun joinRoom(userId: Long, roomCode: String): RoomResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다") }

        val room = roomRepository.findByRoomCode(roomCode)
            .orElseThrow { IllegalArgumentException("방을 찾을 수 없습니다") }

        // 자기 방에 참가 시도
        if (room.host.id == userId) {
            throw IllegalStateException("자신이 만든 방에는 참가할 수 없습니다")
        }

        // 참가 가능 여부 확인
        if (!room.canJoin) {
            throw IllegalStateException("이 방에 참가할 수 없습니다")
        }

        room.join(user)
        val savedRoom = roomRepository.save(room)

        return RoomResponse.from(savedRoom)
    }

    // 방 나가기
    fun leaveRoom(userId: Long, roomId: Long) {
        val room = roomRepository.findById(roomId)
            .orElseThrow { IllegalArgumentException("방을 찾을 수 없습니다") }

        when {
            // 호스트가 나가면 방 삭제
            room.host.id == userId -> {
                room.status = RoomStatus.FINISHED
                roomRepository.delete(room)
            }
            // 게스트가 나가면 게스트만 제거
            room.guest?.id == userId -> {
                room.guest = null
                room.guestFaction = null
                roomRepository.delete(room)
            }
            else -> {
                throw IllegalStateException("이 방의 멤버가 아닙니다")
            }
        }
    }

    // 게임 시작
    fun startGame(userId: Long, roomId: Long): RoomResponse {
        val room = roomRepository.findById(roomId)
            .orElseThrow { IllegalArgumentException("방을 찾을 수 없습니다") }

        // 호스트만 시작 가능
        if (room.host.id != userId) {
            throw IllegalStateException("방장만 게임을 시작할 수 있습니다")
        }

        // 게스트가 있어야 시작 가능
        if (room.guest == null) {
            throw IllegalStateException("상대방이 없습니다")
        }

        room.start()
        val savedRoom = roomRepository.save(room)

        return RoomResponse.from(savedRoom)
    }

    // 방 목록 조회
    @Transactional(readOnly = true)
    fun getWaitingRooms(): List<RoomResponse> {
        return roomRepository.findWaitingRooms()
            .map { RoomResponse.from(it) }
    }

    // 활성 방 목록 (대기 + 진행중)
    @Transactional(readOnly = true)
    fun getActiveRooms(): List<RoomResponse> {
        return roomRepository.findActiveRooms()
            .map { RoomResponse.from(it) }
    }

    // 방 정보 조회
    @Transactional(readOnly = true)
    fun getRoom(roomId: Long): RoomResponse {
        val room = roomRepository.findById(roomId)
            .orElseThrow { IllegalArgumentException("방을 찾을 수 없습니다") }
        return RoomResponse.from(room)
    }

    // 방 코드로 조회
    @Transactional(readOnly = true)
    fun getRoomByCode(roomCode: String): RoomResponse {
        val room = roomRepository.findByRoomCode(roomCode)
            .orElseThrow { IllegalArgumentException("방을 찾을 수 없습니다") }
        return RoomResponse.from(room)
    }

    // 랜덤 방 코드 생성
    private fun generateRoomCode(): String {
        val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // 혼동되는 문자 제외
        var code: String
        do {
            code = (1..6).map { chars.random() }.joinToString("")
        } while (roomRepository.findByRoomCode(code).isPresent)
        return code
    }
}
