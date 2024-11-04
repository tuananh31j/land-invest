function getCenterOfBoundingBoxes(boundingBoxes) {
    const minLon = Math.min(...boundingBoxes.map((box) => box[0]));
    const minLat = Math.min(...boundingBoxes.map((box) => box[1]));
    const maxLon = Math.max(...boundingBoxes.map((box) => box[2]));
    const maxLat = Math.max(...boundingBoxes.map((box) => box[3]));

    // Tính trung điểm
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;

    return [centerLon, centerLat];
}

export default getCenterOfBoundingBoxes;
