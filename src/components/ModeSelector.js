import React, { useEffect, useState } from 'react';

const ModeSelector = ({setSelectedMode, selectedMode}) => {

    const handleChange = (event) => {
        setSelectedMode(event.target.value);
    };


    return (
        <div>
            <label htmlFor="mode-selector">Select Mode: </label>
            <select id="mode-selector" value={selectedMode} onChange={handleChange}>
                <option value="Distribution Playground">Distribution Playground</option>
                <option value="Linear Regression">Linear Regression</option>
            </select>
            <p>Selected Mode: {selectedMode}</p>
        </div>
    );
};

export default ModeSelector;