import factory_creep from "../../factory/creep.js";

import factory_creep_Harvest from "../../factory/creep/Harvest.js";

// 维修者
export default {

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.work && creep.store[RESOURCE_ENERGY] == 0) { // work && 背包为空
            creep.memory.work = false; // 变为 非work状态
            creep.say('🔄 收获');
        }
        if (!creep.memory.work && creep.store.getFreeCapacity() == 0) { // 非work状态 && 背包满(空余为0)
            creep.memory.work = true; // 变为 work状态
            creep.say('🚧 维修');
        }

        let roomName = creep.room.name;

        if (creep.memory.work) { // work状态的时候
            // 修复受损建筑 优先CONTAINER
            let targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.hits < structure.hitsMax;
                }
            });
            // 可通行墙壁
            if (targets.length < 1) {
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_RAMPART) &&
                            structure.hits < structure.hitsMax;
                    }
                });
            }
            // 路
            if (targets.length < 1) {
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_ROAD) &&
                            structure.hits < structure.hitsMax;
                    }
                });
            }
            // 墙壁
            if (targets.length < 1) {
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_WALL) &&
                            structure.hits < structure.hitsMax;
                    }
                });
            }
            if (targets.length < 1) {
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: object => object.hits < object.hitsMax
                });
            }

            targets.sort((a, b) => a.hits - b.hits);

            if (targets.length > 0) {
                // 维修
                if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
                    new factory_creep.Creep(creep).moveTo(targets[0]);
                }
            } else {
                // 不用维修了,先干其他
                let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (targets.length > 0) {
                    // 建造
                    if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                        new factory_creep.Creep(creep).moveTo(targets[0]);
                    }
                }
                if (targets.length < 1) {
                    // 升级
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        new factory_creep.Creep(creep).moveTo(creep.room.controller);
                    }
                }
            }
        } else { // 非work状态的时候， 到source旁边并采集
            const harvests = factory_creep_Harvest.ALL(roomName);
            if (harvests.length < 1) {
                // 采集死完后,自己去采集
                let target = creep.pos.findClosestByPath(FIND_SOURCES);
                if (target) {
                    if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                        // 向目标移动
                        new factory_creep.Creep(creep).moveTo(target, 'Resource');
                    }
                }
            } else {
                let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        // 找出有储存能量的container搬运
                        return (structure.structureType == STRUCTURE_CONTAINER) &&
                            structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
                        // return (structure.structureType == STRUCTURE_CONTAINER ||
                        // 		structure.structureType == STRUCTURE_EXTENSION ||
                        // 		(structure.structureType == STRUCTURE_SPAWN &&
                        // 			structure.store.getUsedCapacity(RESOURCE_ENERGY) > 250) ||
                        // 		structure.structureType == STRUCTURE_TOWER) &&
                        // 	structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
                if (!target) {
                    // 找不到可搬运的地方,从基地搬运
                    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (structure) => {
                            // 找出有储存能量的container搬运
                            return (structure.structureType == STRUCTURE_SPAWN) &&
                                structure.store.getUsedCapacity(RESOURCE_ENERGY) > 200;
                        }
                    });
                }
                if (!target) {
                    // 找不到可搬运的地方,从基地搬运
                    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (structure) => {
                            // 找出有储存能量的container搬运
                            return (structure.structureType == STRUCTURE_EXTENSION) &&
                                structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
                        }
                    });
                }
                if (!target) {
                    // 采集死完后,自己去采集
                    target = creep.pos.findClosestByPath(FIND_SOURCES);
                    if (target) {
                        if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                            // 向目标移动
                            new factory_creep.Creep(creep).moveTo(target, 'Resource');
                        }
                        return
                    }
                }

                if (target) {
                    // 从建筑(structure)中拿取资源
                    if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        // 向目标移动
                        new factory_creep.Creep(creep).moveTo(target, 'Resource');
                    }
                }
            }
        }
    },
    ALL: (...e) => {
        return all(...e);
    }
};

function all(roomName) {
    let returnData;

    if (roomName) {
        returnData = _.filter(Game.creeps, (creep) => (creep.memory.role == globalData.repairer && creep.memory
            .roomName == roomName));
    } else {
        returnData = _.filter(Game.creeps, (creep) => creep.memory.role == globalData.repairer);
    }
    return returnData;
}