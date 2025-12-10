package com.transistorwar.dto

// 게임 메시지 타입
enum class GameMessageType {
    JOIN_ROOM,      // 방 참가
    LEAVE_ROOM,     // 방 퇴장
    GAME_START,     // 게임 시작
    SPAWN_UNIT,     // 유닛 소환
    UNIT_UPDATE,    // 유닛 상태 업데이트
    USE_SKILL,      // 스킬 사용
    BASE_DAMAGE,    // 기지 피해
    GAME_END,       // 게임 종료
    SYNC_STATE      // 전체 상태 동기화
}

// 게임 메시지
data class GameMessage(
    val type: GameMessageType,
    val roomCode: String,
    val playerId: Long? = null,
    val data: Map<String, Any?> = emptyMap()
)

// 유닛 소환 메시지
data class SpawnUnitMessage(
    val unitType: String,  // warrior, ranger, healer, boss
    val faction: String,   // legacy, modern
    val x: Double,
    val y: Double,
    val unitId: String
)

// 유닛 상태 업데이트
data class UnitUpdateMessage(
    val unitId: String,
    val x: Double,
    val y: Double,
    val hp: Int,
    val isAlive: Boolean
)

// 게임 상태 동기화
data class GameStateMessage(
    val roomCode: String,
    val legacyBaseHp: Int,
    val modernBaseHp: Int,
    val legacyElectricity: Int,
    val modernElectricity: Int,
    val units: List<UnitState>
)

data class UnitState(
    val unitId: String,
    val unitType: String,
    val faction: String,
    val x: Double,
    val y: Double,
    val hp: Int,
    val maxHp: Int,
    val isAlive: Boolean
)