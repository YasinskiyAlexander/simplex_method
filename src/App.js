import './App.css';
import {useRef, useState} from "react";

function App() {
    let [countVars, setCountVars] = useState(2);
    let [countConditions, setCountConditions] = useState(2);
    let [objFuncValues, setObjFuncValues] = useState([['', '']]);
    let [condVal, setCondVal] = useState([[
        [
            '',
            '',
            '',
        ],
        [
            '',
            '',
            '',
        ],
    ]]);
    let [simplexBase, setSimplexBase] = useState([{
        varId: [],
        varVal: []
    },]);
    let [evaluatedLine, setEvaluatedLine] = useState([]);
    let [directedColumn, setDirectedColumn] = useState([]);
    let [directedRow, setDirectedRow] = useState([]);
    let [directedElemVal, setDirectedElemVal] = useState([]);
    let [inputErrorCount, setInputErrorCount] = useState(0);
    let [result, setResult] = useState(0);

    const inputErrorMessage = useRef(null);
    const outputBlock = useRef(null);

    function handleObjFuncInput(e) {
        if (isNaN(e.target.value)) {
            if (!e.target.style.border) {
                setInputErrorCount(prev => prev + 1)
                e.target.style = "border: 1px solid red";
            }
        } else if (e.target.style.border) {
            setInputErrorCount(prev => prev - 1)
            e.target.style = "";
        }

        setObjFuncValues(prev => {
            const objFuncId = e.target.id[e.target.id.length - 1] - 1;
            prev[0][objFuncId] = e.target.value;

            return [...prev];
        })
    }

    function initObjFuncValues() {
        for (const objFuncId in objFuncValues[0]) {
            objFuncValues[0][objFuncId] = objFuncValues[0][objFuncId];
        }

        for (const objFuncId in objFuncValues[0]) {
            if (objFuncValues[0][objFuncId] === "")
                objFuncValues[0][objFuncId] = Math.random() * (10000 + 10000) - 10000;
        }

        objFuncValues.push([]);
        for (const objFuncValueId in objFuncValues[0]) {
            objFuncValues[1][objFuncValueId] = objFuncValues[0][objFuncValueId];
        }
    }

    function addObjFuncValues() {
        for (const objFuncId in objFuncValues[0])
            objFuncValues[1][objFuncId] = Number(objFuncValues[1][objFuncId]);

        for (let i = 0; i < condVal[0].length; i++)
            objFuncValues[1].push(0);
    }

    function handleConditInput(e) {
        const inputRowId = Number(e.target.id.slice(7, 8));
        const inputVarId = Number(e.target.id.slice(8));

        if (isNaN(e.target.value) || (Number(e.target.value) === 0 && inputVarId > 0)) {
            if (!e.target.style.border) {
                setInputErrorCount(prev => prev + 1)
                e.target.style = "border: 1px solid red";
            }
        } else {
            if (e.target.style.border) {
                setInputErrorCount(prev => prev - 1)
                e.target.style = "";
            }
        }

        setCondVal(prev => {
            let tempState = [...prev];
            tempState[0][inputRowId][inputVarId] = e.target.value;
            return [...tempState];
        });
    }

    function initCondVal() {
        for (const condId in condVal[0]) {
            for (const varId in condVal[0][condId]) {
                if (condVal[0][condId][varId] !== "")
                    condVal[0][condId][varId] = Number(condVal[0][condId][varId]);
                if (!condVal[0][condId][varId])
                    condVal[0][condId][varId] = Math.random() * (10000 + 10000) - 10000;
            }
        }
    }

    function iterateCondVal() {
        condVal.push([]);
        for (let i = 0; i < condVal[condVal.length - 2].length; i++) {
            condVal[1].push([]);
            for (let j = 0; j < condVal[condVal.length - 2][i].length; j++) {
                condVal[1][i][j] = condVal[0][i][j];

            }
        }
    }

    function calcCondVal() {
        //add new array for the values of new table
        condVal.push([]);
        //copy values of previous table to the array of new table
        for (const CondValRow in condVal[condVal.length - 2]) {
            condVal[condVal.length - 1].push([]);
            for (const CondValElem in condVal[condVal.length - 2][CondValRow]) {
                condVal[condVal.length - 1][CondValRow][CondValElem] = condVal[condVal.length - 2][CondValRow][CondValElem]
            }
        }
        //if condVal has more than 2 arrays of values
        //first array is for user's values, second is for values of the first table
        if (condVal.length > 2) {
            //calculate the values of the second table
            for (const CondValRow in condVal[condVal.length - 1]) {
                for (const CondValElem in condVal[condVal.length - 1][CondValRow]) {
                    const CurrentRow = Number(CondValRow);
                    const DirRow = directedRow[directedRow.length - 1];
                    //if current row is a directed row, new value is value/directed value
                    //a/b
                    if (DirRow === CurrentRow) {
                        condVal[condVal.length - 1][CondValRow][CondValElem] =
                            condVal[condVal.length - 1][CondValRow][CondValElem] / directedElemVal[directedElemVal.length - 1];
                    } else {
                        //else new value is value - value of the directed row* value of the directed column / directed value
                        //a-c*d/b
                        condVal[condVal.length - 1][CondValRow][CondValElem] =
                            condVal[condVal.length - 2][CondValRow][CondValElem] -
                            ((condVal[condVal.length - 2][directedRow[directedRow.length - 1]][CondValElem] *
                                    condVal[condVal.length - 2][CurrentRow][directedColumn[directedColumn.length - 1]]) /
                                directedElemVal[directedElemVal.length - 1]);
                    }
                }
            }
        }
    }

    function initSimplexBase() {
        for (const condValId in condVal[0]) {
            simplexBase[0].varId.push(objFuncValues[1].length + 1 + (condValId - condVal[1].length))
            simplexBase[0].varVal.push(objFuncValues[1][objFuncValues[1].length + (condValId - condVal[1].length)])
        }
    }

    function iterateSimplexBase(value, index, position) {
        let varValues = [];
        let varIndexes = [];
        for (const condValId in condVal[0]) {
            if (position === Number(condValId)) {
                varIndexes.push(index);
                varValues.push(value);
            } else {
                varIndexes.push(simplexBase[simplexBase.length - 1].varId[condValId])
                varValues.push(simplexBase[simplexBase.length - 1].varVal[condValId])
            }
        }
        simplexBase.push({varVal: varValues, varId: varIndexes});
    }

    function calcEvaluatedLine() {
        evaluatedLine.push([]);
        const currentTable = evaluatedLine.length;
        for (let i = 0; i < condVal[currentTable][0].length; i++) {
            let evaluation = 0;
            for (const condValRowId in condVal[currentTable]) {
                evaluation += condVal[currentTable][condValRowId][i] * simplexBase[simplexBase.length - 1].varVal[condValRowId]
            }
            if (i > 0)
                evaluation -= objFuncValues[1][i - 1];
            evaluatedLine[currentTable - 1][i] = evaluation;
        }
    }


    function Calculate() {
        if (inputErrorCount) {
            inputErrorMessage.current.style = "display:block";
            return;
        } else
            inputErrorMessage.current.style = "";

        objFuncValues = [objFuncValues[0]];
        condVal = [condVal[0]];
        simplexBase = [{
            varId: [],
            varVal: []
        },];
        evaluatedLine = [];
        directedColumn = [];
        directedRow = [];
        directedElemVal = [];
        result = 0;


        initObjFuncValues();

        initCondVal();

        CanonicalForm();

        SimplexMethod();

        setObjFuncValues(() => {
            return [...objFuncValues];
        })
        setCondVal(() => {
            return [...condVal];
        })
        setSimplexBase(() => {
            return [...simplexBase];
        })
        setEvaluatedLine(() => {
            return evaluatedLine;
        })
        setDirectedColumn(() => {
            return directedColumn;
        })
        setDirectedRow(() => {
            return directedRow;
        })
        setDirectedElemVal(() => {
            return directedElemVal;
        })
        setResult(() => {
            return result;
        })

        outputBlock.current.style.display = "block";
    }

    function CanonicalForm() {
        addObjFuncValues();

        iterateCondVal();

        //reduce coefficients
        let CanonicalValuesID = condVal.length - 1;
        for (let j = 0; j < condVal[CanonicalValuesID].length; j++) {
            let biggestNum = 0;
            for (let k = 1; k < condVal[CanonicalValuesID][j].length; k++) {
                //look for the biggest denominator
                if (condVal[CanonicalValuesID][j][k] > biggestNum)
                    biggestNum = condVal[CanonicalValuesID][j][k];
            }

            for (let k = 0; k < condVal[CanonicalValuesID][j].length; k++) {
                if (k === 0) {
                    //multiply the free member to the biggest denominator
                    condVal[condVal.length - 1][j][k] = biggestNum * condVal[CanonicalValuesID][j][k];
                } else {
                    //divide the biggest denominator to the coefficient before unknown X
                    condVal[condVal.length - 1][j][k] = biggestNum / condVal[CanonicalValuesID][j][k];
                }
            }
        }

        //add free variables
        for (let i = 0; i < condVal[0].length; i++) {
            for (let condId in condVal[0]) {
                const inputVarId = condVal[condVal.length - 2][condId].length

                if (Number(condId) === i)
                    condVal[condVal.length - 1][condId][inputVarId + i] = 1;
                else
                    condVal[condVal.length - 1][condId][inputVarId + i] = 0;
            }
        }
    }

    function SimplexMethod() {
        //fill first table
        initSimplexBase();

        calcEvaluatedLine();
        result = chooseDirected();

        if (result === 0) {
            let counter = 0;
            do {
                iterateSimplexBase(objFuncValues[1][directedColumn[directedColumn.length - 1] - 1],
                    directedColumn[directedColumn.length - 1],
                    directedRow[directedRow.length - 1]);
                calcCondVal();
                calcEvaluatedLine();
                result = chooseDirected();
                counter++;
            } while (result === 0 && counter < 100)
            if (counter >= 100)
                result = -1;
        }
    }

    function chooseDirected() {
        let leastColumnVal = 0;
        let leastColumnId;
        let leastRowVal = 99999999;
        let leastRowId = -1;

        //look for the biggest negative value
        const lastEvaluatedLineId = evaluatedLine.length - 1;
        for (let i = 1; i < evaluatedLine[lastEvaluatedLineId].length; i++) {
            if (evaluatedLine[lastEvaluatedLineId][i] < leastColumnVal) {
                leastColumnVal = evaluatedLine[lastEvaluatedLineId][i];
                leastColumnId = i;
            }
        }

        //return if the biggest is 0
        if (leastColumnVal >= 0) {
            return 1;
        }

        //look for the smallest correlation between value of column A0 and value of directed column
        for (let i = 0; i < condVal[condVal.length - 1].length; i++) {

            if (condVal[condVal.length - 1][i][leastColumnId] > 0) {
                if (condVal[condVal.length - 1][i][0] /
                    condVal[condVal.length - 1][i][leastColumnId] < leastRowVal) {

                    leastRowVal = condVal[condVal.length - 1][i][0] / condVal[condVal.length - 1][i][leastColumnId];
                    leastRowId = i;
                }
            }
        }

        //return if there isn't the smallest correlation
        if (leastRowId === -1) {
            return -1;
        }

        //add values of directed column row and element
        directedColumn.push(leastColumnId);
        directedRow.push(leastRowId);
        directedElemVal.push(condVal[condVal.length - 1][leastRowId][leastColumnId]);

        //return if the variable of the directed column already exist in the basis
        for (const simplexBaseId in simplexBase[simplexBase.length - 1].varId) {
            for (const objFuncValuesId in objFuncValues[1]) {
                if (simplexBase[simplexBase.length - 1].varId[simplexBaseId] ===
                    directedColumn[directedColumn.length - 1]) {
                    return -1;
                }
            }
        }

        //return 0 if the task isn't complete yet
        return 0;
    }

    function handleCountVarsInput(e) {
        if (Number(e.target.value) < 11 && Number(e.target.value) > 1) {
            setCountVars(() => Number(e.target.value));
            setObjFuncValues(prev => {
                const ObjFuncValuesLength = prev[0].length
                if (e.target.value > ObjFuncValuesLength) {
                    for (let i = 0; i < e.target.value - ObjFuncValuesLength; i++) {
                        prev[0][prev[0].length] = "";
                    }
                } else if (e.target.value < ObjFuncValuesLength) {
                    for (let i = 0; i < ObjFuncValuesLength - e.target.value; i++)
                        prev[0].pop();
                }
                return prev;
            });
            setCondVal(prev => {
                for (const prevElementKey in prev[0]) {
                    if (e.target.value > prev[0][prevElementKey].length - 1) {
                        while (e.target.value > prev[0][prevElementKey].length - 1)
                            prev[0][prevElementKey].push("");
                    } else if (e.target.value < prev[0][prevElementKey].length - 1) {
                        while (prev[0][prevElementKey].length - 1 > e.target.value)
                            prev[0][prevElementKey].pop();
                    }
                }
                return [...prev]
            })
        }

    }

    function handleCountCondInput(e) {
        if (Number(e.target.value) < 11 && Number(e.target.value) > 1) {
            setCountConditions(() => Number(e.target.value));

            setCondVal(prev => {
                if (e.target.value > prev[0].length) {
                    while (e.target.value > prev[0].length) {
                        prev[0].push([]);
                        for (let i = 0; i < prev[0][prev[0].length - 2].length; i++) {
                            prev[0][prev[0].length - 1].push("");
                        }
                    }
                } else if (e.target.value < prev[0].length) {
                    while (prev[0].length > e.target.value) {
                        prev[0].pop();

                    }
                }

                return [...prev]
            })
        }
    }

    return (
        <div className="App">
            <header className="header">
                <div className="header_container">Симплекс метод</div>
            </header>
            <main className="page">
                <div className="main">
                    <div className="inputBlock">
                        <div className="inputBlock_container">
                            <div className="mainParams">
                                <div className="mainParamsContainer countVarsContainer">
                                    <h4 className="mainParams__caption">Введіть кількість змінних</h4>
                                    <input onChange={handleCountVarsInput} value={countVars} type="number"
                                           className="mainParamInput countVars"/>
                                </div>
                                <div className="mainParamsContainer countConditionsContainer">
                                    <h4 className="mainParams__caption">Введіть кількість умов-обмежень</h4>
                                    <input onChange={handleCountCondInput} value={countConditions} type="number"
                                           className="mainParamInput countConditions"/>
                                </div>
                            </div>
                            <div className="objectFunctionBlock">
                                <h3 className="inputBlock__caption">Введіть значення цільової функції:</h3>
                                <div className="objectFunction">
                                    <span>F(
                                        {
                                            objFuncValues[0].map((value, index) =>
                                                <span>
                                                    x
                                                    <sub>{index + 1}</sub>
                                                    {index < objFuncValues[0].length - 1 && ", "}
                                                </span>
                                            )
                                        }
                                        )</span>
                                    <span>=</span>
                                    {
                                        objFuncValues[0].map((value, index) => {
                                            return <>
                                                <input id={`objFuncvar${index + 1}`} onChange={handleObjFuncInput}
                                                       value={value}
                                                       type="text"
                                                       className="objectFunctionBlock__input inputBlock__input"/>
                                                <span>x<sub>{index + 1}</sub></span>
                                            </>
                                        })
                                    }
                                    <span>→</span>
                                    <span>max</span>
                                </div>
                            </div>

                            <div className="conditionsBlock">
                                <h3 className="inputBlock__caption">Введіть значення умов-обмежень:</h3>
                                <div className="conditionsSystem">
                                    <div className="bracket">
                                    </div>
                                    <div className="conditions">
                                        {
                                            condVal[0].map((valueCond, indexCond) =>
                                                <div className="condition">
                                                    {
                                                        valueCond.map((value, index) => {
                                                                if (index === 0)
                                                                    return;
                                                                return (<>
                                                                    <div className="fraction">
                                                                        <div className="fraction__part numerator">
                                                                            <span>1</span>
                                                                        </div>
                                                                        <div className="fraction__part">
                                                                            <input id={`condvar${indexCond}${index}`}
                                                                                   onChange={handleConditInput}
                                                                                   value={value} type="text"
                                                                                   pattern="-?[0-9]"
                                                                                   className="conditionsBlock__input inputBlock__input"/>
                                                                        </div>
                                                                    </div>
                                                                    <span>x<sub>{index}</sub></span>
                                                                </>)
                                                            }
                                                        )
                                                    }

                                                    <span>≤</span>
                                                    <input id={`condvar${indexCond}0`} onChange={handleConditInput}
                                                           value={valueCond[0]} type="text"
                                                           className="conditionsBlock__input inputBlock__input"/>
                                                </div>
                                            )
                                        }
                                        <div className="condition">
                                            {
                                                objFuncValues[0].map((value, index) => {

                                                    return <span>
                                                    x
                                                    <sub>{index + 1}</sub>
                                                        {index < objFuncValues[0].length - 1 && ", "}
                                                </span>
                                                })
                                            }
                                            <span>≥</span>
                                            <span>0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div ref={inputErrorMessage} className="inputError">
                                <p>Введено не числові значення, або ділення на нуль. Введіть тільки числа.</p>
                            </div>
                            <div className="calculateBtnBlock">
                                <input onClick={Calculate} type="button" className="calculateBtn" value="Вирішити"/>
                            </div>
                        </div>
                    </div>
                    <div ref={outputBlock} className="outputBlock">
                        <div className="outputBlock_container">
                            <div className="canonicalForm">
                                <h3>Канонічний вигляд</h3>
                                <div className="objectFunction">
                                    <span>F(
                                        {
                                            objFuncValues[1]?.map((value, index) =>
                                                <span>
                                                    x
                                                    <sub>{index + 1}</sub>
                                                    {index < objFuncValues[1].length - 1 && ", "}
                                                </span>
                                            )
                                        }
                                        )</span>
                                    <span>=</span>
                                    {
                                        objFuncValues[1]?.map((value, index) => {
                                            return <>
                                                {index !== 0 && <span>+</span>}
                                                <div>
                                                    <span>{Math.round(value * 100) / 100}</span>
                                                    <span>x<sub>{index + 1}</sub></span>
                                                </div>
                                            </>
                                        })
                                    }

                                    <span>→</span>
                                    <span>max</span>
                                </div>
                                <div className="conditionsSystem">
                                    <div className="bracket">
                                    </div>
                                    <div className="conditions">
                                        {
                                            condVal[1]?.map((valueCond, indexCond) =>
                                                <div className="condition">
                                                    {
                                                        valueCond.map((value, index) =>
                                                            index > 0 &&
                                                            <>
                                                                {Number(index) > 1 && <span>+</span>}
                                                                <div>
                                                                    <span>{Math.round(value * 100) / 100}</span>
                                                                    <span>x<sub>{index}< /sub></span>
                                                                </div>
                                                            </>
                                                        )
                                                    }
                                                    <span>≤</span>
                                                    {
                                                        condVal[1] &&
                                                        <span>{Math.round(condVal[1][indexCond][0] * 100) / 100}</span>
                                                    }
                                                </div>)
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="simplexBlock">
                                {
                                    simplexBase.length &&
                                    simplexBase.map((value, tableIndex) => {
                                        return (<div className="tables">
                                            <h3 className="tableTitle">Table {tableIndex + 1}</h3>
                                            <table className="table table1">
                                                <tbody>
                                                <tr>
                                                    <td className="cell"></td>
                                                    <td className="cell">C</td>
                                                    <td className="cell">-</td>
                                                    {
                                                        objFuncValues[1]?.map((value) =>
                                                            <td className="cell">
                                                                <span>{Math.round(value * 100) / 100}</span>
                                                            </td>
                                                        )
                                                    }
                                                </tr>
                                                <tr>
                                                    <td className="cell"></td>
                                                    <td className="cell">B</td>
                                                    <td className="cell italic">A<sub>0</sub></td>
                                                    {
                                                        objFuncValues[1]?.map((value, index) =>
                                                            <td className="cell italic">A<sub>{index + 1}</sub></td>
                                                        )
                                                    }
                                                </tr>
                                                {
                                                    condVal[tableIndex + 1]?.map((valueCond, indexCond) => {
                                                            return (
                                                                <tr>
                                                                    <td className="cell">{
                                                                        Math.round(simplexBase[tableIndex]?.varVal[indexCond] * 100) / 100
                                                                    }</td>
                                                                    {
                                                                        simplexBase[tableIndex] &&
                                                                        <td className={`cell directedRow ${indexCond === directedRow[tableIndex] && "directedCell"}`}>
                                                                            <span
                                                                                className="italic directedRowSpan">x<sub>{simplexBase[tableIndex].varId[indexCond]}</sub></span>
                                                                            <span
                                                                                className={`${indexCond !== directedRow[tableIndex] && "notDirected"}`}>←</span>
                                                                        </td>

                                                                    }
                                                                    {
                                                                        valueCond.map((value, index) => {
                                                                                if (index === 0) {
                                                                                }
                                                                                return <td
                                                                                    className={`cell ${directedColumn[tableIndex] === index &&
                                                                                    directedRow[tableIndex] === indexCond &&
                                                                                    "directedElem"}`}>{Math.round(value * 100) / 100}</td>
                                                                            }
                                                                        )
                                                                    }
                                                                </tr>
                                                            )
                                                        }
                                                    )
                                                }
                                                <tr>
                                                    <td className="cell"></td>
                                                    <td className="cell">∆</td>
                                                    {
                                                        evaluatedLine.length > 0 &&
                                                        evaluatedLine[tableIndex]?.map((value, index) =>
                                                            <td className={`cell directedColumn ${index === directedColumn[tableIndex] && "directedCell"}`}>
                                                                <span>{Math.round(value * 100) / 100}</span>
                                                                <span className={`${index === 0 ? "notDirected"
                                                                    : index !== directedColumn[tableIndex] && "notDirected"}`}>{" ↑"}</span>
                                                            </td>
                                                        )
                                                    }
                                                </tr>
                                                </tbody>

                                            </table>
                                        </div>);
                                    })
                                }
                            </div>
                            <div className="answerBlock">
                                <h4 className="answerTitle">Відповідь</h4>
                                <div className="result">
                                    {
                                        result === 1 &&
                                        <div>
                                            <p className="result__p">
                                                <span>F<sub>max</sub></span>
                                                <span>=</span>
                                                <span>{Math.round(evaluatedLine[evaluatedLine.length - 1][0] * 100) / 100}</span>
                                            </p>
                                            {
                                                objFuncValues[1]?.map((value, index) => {
                                                    if (index > condVal[condVal.length - 1].length - 1)
                                                        return;
                                                    for (const baseVarId in simplexBase[simplexBase.length-1].varId){
                                                        if (Number(simplexBase[simplexBase.length-1].varId[baseVarId]) ===Number(index+1)){
                                                            return (
                                                                <p className="result__p">
                                                                    <span>x<sub>{index + 1}</sub></span>
                                                                    <span>=</span>
                                                                    <span>{Math.round(condVal[condVal.length - 1][index][0] * 100) / 100}</span>
                                                                </p>
                                                            )
                                                        }
                                                    }
                                                    return (
                                                        <p className="result__p">
                                                            <span>x<sub>{index + 1}</sub></span>
                                                            <span>=</span>
                                                            <span>0</span>
                                                        </p>
                                                    )
                                                })
                                            }

                                        </div>
                                    }
                                    {
                                        result === -1 &&
                                        <div>
                                            <p className="result__p">Задача немає розв'язків, або має нескінченну
                                                кількість розв'язків</p>
                                        </div>

                                    }
                                </div>

                            </div>

                        </div>
                    </div>


                </div>
            </main>
        </div>
    )
        ;
}

export default App;
