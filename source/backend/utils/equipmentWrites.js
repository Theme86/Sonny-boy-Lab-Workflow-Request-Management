// utils/equipmentWrites.js — the database writes behind PATCH and DELETE.
const { prisma } = require('../lib/prisma');
const { equipmentInclude } = require('./equipmentResponse');

// propertyIds, if sent, REPLACES the whole property list
function updateEquipment(equipmentId, data, propertyIds) {
  return prisma.$transaction(async (tx) => {
    if (propertyIds) {
      await tx.propEquip.deleteMany({ where: { equipmentId } });
      if (propertyIds.length) {
        await tx.propEquip.createMany({
          data: propertyIds.map((propertyId) => ({ equipmentId, propertyId })),
        });
      }
    }
    return tx.equipment.update({ where: { equipmentId }, data, include: equipmentInclude });
  });
}

// FKs are ON DELETE RESTRICT, so equipment used by sessions / requests / reservations
// cannot be deleted (409). Property links (prop_equip) are cleaned up first.
function deleteEquipment(equipmentId) {
  return prisma.$transaction([
    prisma.propEquip.deleteMany({ where: { equipmentId } }),
    prisma.equipment.delete({ where: { equipmentId } }),
  ]);
}

module.exports = { updateEquipment, deleteEquipment };