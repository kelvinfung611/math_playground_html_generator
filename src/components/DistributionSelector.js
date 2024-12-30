import React, { useEffect } from 'react';

const distribution = [
    'uniform',
    'normal',
    'poisson',
];

const DistributionSelector = ({ selectedDistribution, setSelectedDistribution }) => {
    //set initial state
    function handleChange(dist) {
        setSelectedDistribution((prev) => {
            if (prev.includes(dist)) {
                return prev.filter((d) => d !== dist);
            } else {
                return [...prev, dist];
            }
        });
        // set the box to be checked
    }
    useEffect(() => {
        console.log(selectedDistribution);
    }, [selectedDistribution]);

    return (
        <div>
            {distribution.map((dist) => (
                <label key={dist}>
                    <input
                        type="checkbox"
                        checked={selectedDistribution.includes(dist)}
                        onChange={() => handleChange(dist)}
                    />
                    {dist}
                </label>
            ))}
        </div>
    );
};

export default DistributionSelector;