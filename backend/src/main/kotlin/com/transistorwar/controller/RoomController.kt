package com.transistorwar.controller

import com.transistorwar.dto.*
import com.transistorwar.security.UserPrincipal
import com.transistorwar.service.RoomService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/rooms")
class RoomController(
    private val roomService: RoomService
) {

    // 방 생성
    @PostMapping
    fun createRoom(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: CreateRoomRequest
    ): ResponseEntity<ApiResponse<RoomResponse>> {
        return try {
            val room = roomService.createRoom(principal.id, request)
            ResponseEntity.ok(ApiResponse.success(room, "방 생성 완료"))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "방 생성 실패"))
        }
    }

    // 방 참가
    @PostMapping("/join")
    fun joinRoom(
        @AuthenticationPrincipal principal: UserPrincipal,
        @Valid @RequestBody request: JoinRoomRequest
    ): ResponseEntity<ApiResponse<RoomResponse>> {
        return try {
            val room = roomService.joinRoom(principal.id, request.roomCode)
            ResponseEntity.ok(ApiResponse.success(room, "방 참가 완료"))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "방 참가 실패"))
        }
    }

    // 방 나가기
    @PostMapping("/{roomId}/leave")
    fun leaveRoom(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PathVariable roomId: Long
    ): ResponseEntity<ApiResponse<Unit>> {
        return try {
            roomService.leaveRoom(principal.id, roomId)
            ResponseEntity.ok(ApiResponse.success(Unit, "방 나가기 완료"))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "방 나가기 실패"))
        }
    }

    // 게임 시작
    @PostMapping("/{roomId}/start")
    fun startGame(
        @AuthenticationPrincipal principal: UserPrincipal,
        @PathVariable roomId: Long
    ): ResponseEntity<ApiResponse<RoomResponse>> {
        return try {
            val room = roomService.startGame(principal.id, roomId)
            ResponseEntity.ok(ApiResponse.success(room, "게임 시작"))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "게임 시작 실패"))
        }
    }

    // 대기중인 방 목록 (공개)
    @GetMapping("/list")
    fun getWaitingRooms(): ResponseEntity<ApiResponse<List<RoomResponse>>> {
        val rooms = roomService.getWaitingRooms()
        return ResponseEntity.ok(ApiResponse.success(rooms))
    }

    // 활성 방 목록
    @GetMapping("/active")
    fun getActiveRooms(): ResponseEntity<ApiResponse<List<RoomResponse>>> {
        val rooms = roomService.getActiveRooms()
        return ResponseEntity.ok(ApiResponse.success(rooms))
    }

    // 방 정보 조회
    @GetMapping("/{roomId}")
    fun getRoom(@PathVariable roomId: Long): ResponseEntity<ApiResponse<RoomResponse>> {
        return try {
            val room = roomService.getRoom(roomId)
            ResponseEntity.ok(ApiResponse.success(room))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "방을 찾을 수 없습니다"))
        }
    }

    // 방 코드로 조회
    @GetMapping("/code/{roomCode}")
    fun getRoomByCode(@PathVariable roomCode: String): ResponseEntity<ApiResponse<RoomResponse>> {
        return try {
            val room = roomService.getRoomByCode(roomCode)
            ResponseEntity.ok(ApiResponse.success(room))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(ApiResponse.error(e.message ?: "방을 찾을 수 없습니다"))
        }
    }
}
