import React, { useEffect } from 'react';

const features = [
    ["userGuide", "autoScales", "TableStatistics"],
    ['uniform',
        'normal',
        'poisson'],
];

const RegressionSelector = ({ selectedMode, selectedFeature, setSelectedFeature }) => {
    //set initial state
    function handleChange(fea) {
        setSelectedFeature((prev) => {
            if (prev.includes(fea)) {
                return prev.filter((f) => f !== fea);
            } else {
                return [...prev, fea];
            }
        });
        // set the box to be checked
    }
    useEffect(() => {
        console.log(selectedFeature);
    }, [selectedFeature]);

    //when selectedMode changed, the selectedFeature has to be empty
    useEffect(() => {
        setSelectedFeature([]);
    }, [selectedMode]);

    return (
        <div>
            {selectedMode === 'Distribution Playground' && features[1].map((fea) => (
                <label key={fea}>
                    <input
                        type="checkbox"
                        checked={selectedFeature.includes(fea)}
                        onChange={() => handleChange(fea)}
                    />
                    {fea}
                </label>
            ))}
            {selectedMode === 'Linear Regression' && features[0].map((fea) => (
                <label key={fea}>
                    <input
                        type="checkbox"
                        checked={selectedFeature.includes(fea)}
                        onChange={() => handleChange(fea)}
                    />
                    {fea}
                </label>
            ))}
        </div>
    );
};

export default RegressionSelector;