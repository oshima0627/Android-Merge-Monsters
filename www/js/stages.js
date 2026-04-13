/**
 * Stage definitions with main goals and bonus missions.
 * Grid continues between stages (no reset).
 */
const Stages = (() => {
    // Mission types:
    // reach_level: Create a monster of this level
    // merge_count: Total merges this stage
    // hold_coins: Have at least X coins at once
    // monsters_at_level: Have X monsters at level Y or above on the grid simultaneously
    // summon_count: Summon X monsters this stage

    const STAGE_DATA = [
        {
            id: 1,
            name: 'はじめの一歩',
            main: { type: 'reach_level', value: 2, label: 'Lv.2モンスターを作ろう' },
            missions: [
                { type: 'merge_count', value: 3, label: '3回合体しよう' },
                { type: 'hold_coins', value: 30, label: 'コインを30枚貯めよう' },
                { type: 'summon_count', value: 5, label: '5体召喚しよう' },
            ],
            reward: 20,
        },
        {
            id: 2,
            name: '合体マスター',
            main: { type: 'reach_level', value: 3, label: 'Lv.3モンスターを作ろう' },
            missions: [
                { type: 'merge_count', value: 8, label: '8回合体しよう' },
                { type: 'monsters_at_level', value: 2, level: 2, label: 'Lv.2を2体同時に持とう' },
                { type: 'hold_coins', value: 60, label: 'コインを60枚貯めよう' },
            ],
            reward: 40,
        },
        {
            id: 3,
            name: '成長の兆し',
            main: { type: 'reach_level', value: 4, label: 'Lv.4モンスターを作ろう' },
            missions: [
                { type: 'merge_count', value: 15, label: '15回合体しよう' },
                { type: 'hold_coins', value: 100, label: 'コインを100枚貯めよう' },
                { type: 'monsters_at_level', value: 3, level: 2, label: 'Lv.2以上を3体持とう' },
            ],
            reward: 60,
        },
        {
            id: 4,
            name: '王冠への道',
            main: { type: 'reach_level', value: 5, label: 'Lv.5モンスターを作ろう' },
            missions: [
                { type: 'monsters_at_level', value: 3, level: 3, label: 'Lv.3以上を3体持とう' },
                { type: 'merge_count', value: 25, label: '25回合体しよう' },
                { type: 'hold_coins', value: 200, label: 'コインを200枚貯めよう' },
            ],
            reward: 100,
        },
        {
            id: 5,
            name: 'ドヤ顔の誘惑',
            main: { type: 'reach_level', value: 6, label: 'Lv.6モンスターを作ろう' },
            missions: [
                { type: 'hold_coins', value: 300, label: 'コインを300枚貯めよう' },
                { type: 'merge_count', value: 40, label: '40回合体しよう' },
                { type: 'monsters_at_level', value: 2, level: 4, label: 'Lv.4以上を2体持とう' },
            ],
            reward: 200,
        },
        {
            id: 6,
            name: 'ハートの力',
            main: { type: 'reach_level', value: 7, label: 'Lv.7モンスターを作ろう' },
            missions: [
                { type: 'monsters_at_level', value: 2, level: 5, label: 'Lv.5以上を2体持とう' },
                { type: 'hold_coins', value: 500, label: 'コインを500枚貯めよう' },
                { type: 'merge_count', value: 55, label: '55回合体しよう' },
            ],
            reward: 350,
        },
        {
            id: 7,
            name: 'クールな進化',
            main: { type: 'reach_level', value: 8, label: 'Lv.8モンスターを作ろう' },
            missions: [
                { type: 'merge_count', value: 70, label: '70回合体しよう' },
                { type: 'monsters_at_level', value: 4, level: 4, label: 'Lv.4以上を4体持とう' },
                { type: 'hold_coins', value: 800, label: 'コインを800枚貯めよう' },
            ],
            reward: 500,
        },
        {
            id: 8,
            name: '黄金の輝き',
            main: { type: 'reach_level', value: 9, label: 'Lv.9モンスターを作ろう' },
            missions: [
                { type: 'hold_coins', value: 1200, label: 'コインを1200枚貯めよう' },
                { type: 'merge_count', value: 90, label: '90回合体しよう' },
                { type: 'monsters_at_level', value: 3, level: 5, label: 'Lv.5以上を3体持とう' },
            ],
            reward: 800,
        },
        {
            id: 9,
            name: '虹の彼方へ',
            main: { type: 'reach_level', value: 10, label: 'Lv.10モンスターを作ろう' },
            missions: [
                { type: 'monsters_at_level', value: 3, level: 6, label: 'Lv.6以上を3体持とう' },
                { type: 'hold_coins', value: 2000, label: 'コインを2000枚貯めよう' },
                { type: 'merge_count', value: 110, label: '110回合体しよう' },
            ],
            reward: 1500,
        },
        {
            id: 10,
            name: '伝説の領域',
            main: { type: 'reach_level', value: 12, label: 'Lv.12モンスターを作ろう' },
            missions: [
                { type: 'merge_count', value: 150, label: '150回合体しよう' },
                { type: 'monsters_at_level', value: 2, level: 9, label: 'Lv.9以上を2体持とう' },
                { type: 'hold_coins', value: 4000, label: 'コインを4000枚貯めよう' },
            ],
            reward: 3000,
        },
        {
            id: 11,
            name: '究極の頂',
            main: { type: 'reach_level', value: 15, label: 'Lv.15モンスターを作ろう' },
            missions: [
                { type: 'monsters_at_level', value: 5, level: 8, label: 'Lv.8以上を5体持とう' },
                { type: 'merge_count', value: 200, label: '200回合体しよう' },
                { type: 'hold_coins', value: 8000, label: 'コインを8000枚貯めよう' },
            ],
            reward: 10000,
        },
    ];

    let currentStageIndex = 0;
    let stageMergeCount = 0;
    let stageSummonCount = 0;
    let stageCleared = false;
    let stageResults = null;
    let completedMissions = [false, false, false];

    function init() {
        currentStageIndex = 0;
        stageMergeCount = 0;
        stageSummonCount = 0;
        stageCleared = false;
        stageResults = null;
        completedMissions = [false, false, false];
    }

    function getCurrentStage() {
        if (currentStageIndex >= STAGE_DATA.length) return null;
        return STAGE_DATA[currentStageIndex];
    }

    function getStageNumber() {
        return currentStageIndex + 1;
    }

    function getTotalStages() {
        return STAGE_DATA.length;
    }

    function isAllCleared() {
        return currentStageIndex >= STAGE_DATA.length;
    }

    function isStageCleared() {
        return stageCleared;
    }

    function getStageResults() {
        return stageResults;
    }

    function onMerge() {
        stageMergeCount++;
    }

    function onSummon() {
        stageSummonCount++;
    }

    function checkMission(mission, gameState) {
        switch (mission.type) {
            case 'reach_level':
                return gameState.highestLevel >= mission.value;
            case 'merge_count':
                return stageMergeCount >= mission.value;
            case 'summon_count':
                return stageSummonCount >= mission.value;
            case 'hold_coins':
                return gameState.coins >= mission.value;
            case 'monsters_at_level': {
                const occupied = Grid.getOccupiedCells();
                const count = occupied.filter(c => c.monster.level >= mission.level).length;
                return count >= mission.value;
            }
            default:
                return false;
        }
    }

    function checkProgress(gameState) {
        if (stageCleared) return;
        const stage = getCurrentStage();
        if (!stage) return;

        // Check bonus missions (can be completed before main goal)
        for (let i = 0; i < stage.missions.length; i++) {
            if (!completedMissions[i] && checkMission(stage.missions[i], gameState)) {
                completedMissions[i] = true;
            }
        }

        // Check main goal
        if (checkMission(stage.main, gameState)) {
            // Stage cleared!
            let stars = 1; // Main goal = 1 star
            if (completedMissions[0]) stars++;
            if (completedMissions[1]) stars++;
            if (completedMissions[2]) stars++;

            const bonusMultiplier = stars === 4 ? 2.0 : stars === 3 ? 1.5 : stars === 2 ? 1.2 : 1.0;
            const reward = Math.floor(stage.reward * bonusMultiplier);

            stageResults = { stars, maxStars: 4, reward, stageName: stage.name, stageId: stage.id };
            stageCleared = true;
        }
    }

    function getMissionStatus(gameState) {
        const stage = getCurrentStage();
        if (!stage) return null;

        const mainDone = checkMission(stage.main, gameState);
        const missions = stage.missions.map((m, i) => ({
            label: m.label,
            done: completedMissions[i] || checkMission(m, gameState),
        }));

        return {
            stageName: stage.name,
            stageId: stage.id,
            mainLabel: stage.main.label,
            mainDone: mainDone,
            missions: missions,
        };
    }

    function advanceStage() {
        currentStageIndex++;
        stageMergeCount = 0;
        stageSummonCount = 0;
        stageCleared = false;
        stageResults = null;
        completedMissions = [false, false, false];
    }

    function saveStageProg() {
        try {
            localStorage.setItem('mm_stage', currentStageIndex.toString());
        } catch (e) {}
    }

    function loadStageProg() {
        try {
            currentStageIndex = parseInt(localStorage.getItem('mm_stage') || '0', 10);
        } catch (e) {
            currentStageIndex = 0;
        }
    }

    return {
        STAGE_DATA,
        init,
        getCurrentStage,
        getStageNumber,
        getTotalStages,
        isAllCleared,
        isStageCleared,
        getStageResults,
        onMerge,
        onSummon,
        checkProgress,
        getMissionStatus,
        advanceStage,
        saveStageProg,
        loadStageProg,
    };
})();
