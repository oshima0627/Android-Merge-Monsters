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
            intro: 'モンスターの世界へようこそ。\n同じ仲間を重ねて、新しい仲間を呼び寄せよう。',
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
            intro: '合体の感覚をつかんだね。\nもっと強い仲間を目指そう！',
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
            intro: '仲間たちに成長の兆しが見える。\nコインを貯めて、召喚を続けよう。',
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
            intro: '小さな王冠を授かる若き戦士、\nクラウニーが君を待っている。',
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
            intro: '紫の霧を操るムラサメが囁く――\n「もっと高みへ、進む覚悟はある？」',
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
            intro: 'ピンクルの愛の力が仲間を包む。\n愛こそが、道を切り開くのだ。',
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
            intro: '青き戦士ブルーノが現れた。\nクールに、スタイリッシュに決めよう。',
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
            intro: '炎をまとう黄金の英雄ゴールドン。\nその輝きを手に入れよ。',
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
            intro: '翡翠、真紅、紫紺――\n色とりどりの強者たちが待つ、幻の地。',
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
            intro: '伝説の領域に足を踏み入れる――\nここからは、真の勇者の試練だ。',
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
            intro: '全ての創造を超えし虹の神、プリズモン。\nその扉が、今ここに開かれる。',
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

    function getCurrentIntro() {
        const s = getCurrentStage();
        if (!s) return null;
        return { id: s.id, name: s.name, intro: s.intro || '' };
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

    function getMissionProgress(mission, gameState) {
        switch (mission.type) {
            case 'reach_level':
                return { current: gameState.highestLevel, target: mission.value };
            case 'merge_count':
                return { current: stageMergeCount, target: mission.value };
            case 'summon_count':
                return { current: stageSummonCount, target: mission.value };
            case 'hold_coins':
                return { current: Math.floor(gameState.coins), target: mission.value };
            case 'monsters_at_level': {
                const occupied = Grid.getOccupiedCells();
                const count = occupied.filter(c => c.monster.level >= mission.level).length;
                return { current: count, target: mission.value };
            }
            default:
                return null;
        }
    }

    function getMissionStatus(gameState) {
        const stage = getCurrentStage();
        if (!stage) return null;

        const mainDone = checkMission(stage.main, gameState);
        const mainProgress = getMissionProgress(stage.main, gameState);
        const missions = stage.missions.map((m, i) => ({
            label: m.label,
            done: completedMissions[i] || checkMission(m, gameState),
            progress: getMissionProgress(m, gameState),
        }));

        return {
            stageName: stage.name,
            stageId: stage.id,
            mainLabel: stage.main.label,
            mainDone: mainDone,
            mainProgress: mainProgress,
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

    function getSnapshot() {
        return {
            currentStageIndex,
            stageMergeCount,
            stageSummonCount,
            stageCleared,
            stageResults,
            completedMissions: completedMissions.slice(),
        };
    }

    function restoreSnapshot(snap) {
        if (!snap) return;
        currentStageIndex = typeof snap.currentStageIndex === 'number' ? snap.currentStageIndex : 0;
        stageMergeCount = typeof snap.stageMergeCount === 'number' ? snap.stageMergeCount : 0;
        stageSummonCount = typeof snap.stageSummonCount === 'number' ? snap.stageSummonCount : 0;
        stageCleared = !!snap.stageCleared;
        stageResults = snap.stageResults || null;
        completedMissions = Array.isArray(snap.completedMissions) && snap.completedMissions.length === 3
            ? snap.completedMissions.map(Boolean)
            : [false, false, false];
    }

    return {
        STAGE_DATA,
        init,
        getCurrentStage,
        getCurrentIntro,
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
        getSnapshot,
        restoreSnapshot,
    };
})();
