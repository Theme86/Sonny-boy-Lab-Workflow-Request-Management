// utils/equipmentResponse.js — what the API sends back for one equipment row.
const equipmentInclude = {
  properties: { include: { property: true } },
};

// shape the response: flatten PropEquip join rows into a plain properties array,
function toResponse(e) {
  const { categoryId, ...rest } = e;
  return {
    ...rest,
    properties: e.properties.map((p) => p.property),
  };
}

module.exports = { equipmentInclude, toResponse };