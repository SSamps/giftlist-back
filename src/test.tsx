const RED_OBJECT = 'RED_LIST';
const BLUE_OBJECT = 'BLUE_OBJECT';
const SQUARE_OBJECT = 'SQUARE_OBJECT';

const COLOR_OBJECTS = [RED_OBJECT, BLUE_OBJECT];

interface redObject {
    variant: typeof RED_OBJECT;
}

interface blueObject {
    variant: typeof BLUE_OBJECT;
}

interface squareObject {
    variant: typeof SQUARE_OBJECT;
}

type anyObject = redObject | blueObject | squareObject;

const getOBJECT = (): anyObject => {
    return { variant: RED_OBJECT }; // returns RED_OBJECT here but could be anything
};

let unknownOBJECT = getOBJECT(); // returns an object of type anyObject

if (unknownOBJECT.variant === RED_OBJECT) {
    unknownOBJECT; // correctly identified by TS as a redObject
}

if (COLOR_OBJECTS.includes(unknownOBJECT.variant)) {
    unknownOBJECT; // TS incorrectly believes this is still anyObject
}
