import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { useState } from "react";
import { Qbit } from "../hooks/useCircuit";
import { create, all } from "mathjs"; // Importing mathjs

// Create a mathjs instance with all functions
const math = create(all, {});

interface ComplexEditorProps {
  real: number;
  imagin: number;
  line: number;
  onChange: (r: number, i: number) => void;
}
function ComplexEditor({ onChange, real, imagin, line }: ComplexEditorProps) {
  const [latexInput, setLatexInput] = useState(``);

  const [editorVisible, setEditorVisible] = useState(false);
  const [tempReal, setTempReal] = useState(real); // Coefficient for |0>
  const [tempImagin, setTempImagin] = useState(imagin); // Imaginary part for |0>
  const [expression, setExpression] = useState("");

  const toggleEditor = () => {
    setEditorVisible((prev) => !prev);

    // Set the input values when opening the editor
    if (!editorVisible) {
      if (expression.length > 0) {
        setLatexInput(`\\(${expression}\\)`); // Initialize LaTeX input
      } else {
        setLatexInput(`\\(${real} + ${imagin}i\\)`); // Initialize LaTeX input
      }
    } else {
      handleSubmit();
    }
  };
  const handleLatexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLatexInput(e.target.value);
  };
  const parseLatexToValues = (latex: string) => {
    // Convert LaTeX to a mathjs expression
    const expression = latex.replace(/\\\((.*?)\\\)/, "$1"); // Remove LaTeX delimiters

    // Keep 'i' for the imaginary part
    const safeExpression = expression; // No replacement needed

    try {
      // Evaluate the expression
      const evaluated = math.evaluate(safeExpression);
      setExpression(safeExpression);
      console.log(safeExpression);
      if (evaluated.type === "Complex") {
        const { re, im } = evaluated;
        return [re, im];
      } else {
        return [evaluated, 0];
      }
    } catch (error) {
      console.error("Error evaluating expression:", error);
      throw new Error()
    }
  };

  const handleSubmit = () => {
    const [re, im] = parseLatexToValues(latexInput);
    onChange(re, im); // Submit all values
    setEditorVisible(false); // Close editor after submission
  };

  return (
    <div className="flex">
      {editorVisible ? (
        <>
          {" "}
          <input
            className="w-24 mr-2 border"
            type="text"
            value={latexInput}
            onChange={handleLatexChange}
            placeholder="Enter LaTeX (e.g., \\( a + bi \\))"
          />
        </>
      ) : (
        <>
          {expression.length > 0 ? (
            expression
          ) : (
            <>
              {real} + {imagin}i
            </>
          )}
        </>
      )}
      {`   |${line}>   `}
      <button
        className="bg-orange-400 p-1 rounded-sm text-sm ml-2"
        onClick={toggleEditor}
      >
        {editorVisible ? "Submit" : "Edit"}
      </button>
    </div>
  );
}

interface QBitNodeData extends Qbit {
  index: number;
  modalVisible: boolean;
  onChange: (r_0: number, i_0: number, r_1: number, i_1: number) => void;
  [key: string]: unknown; // Ensures that QBitNodeData satisfies the Record<string, unknown> constraint
}

type QBitNode = Node<QBitNodeData, "qbit">;

export default function QBitNode({ data }: NodeProps<QBitNode>) {
  const { real_0, imagin_0, real_1, imagin_1, index, onChange } = data;

  return (
    <div className="relative w-12 h-12 bg-white">
      <div className="w-12 h-12 border-2 rounded-md flex items-center justify-center">
        [{index}]<Handle type="source" position={Position.Right}></Handle>
      </div>

      <div className="absolute top-0 left-[-220px] w-52 h-24 border-2 bg-white z-10 p-2 flex items-center flex-col justify-center gap-2">
        <ComplexEditor
          imagin={imagin_0}
          real={real_0}
          line={0}
          onChange={(r, i) => {
            onChange(r, i, real_1, imagin_1);
          }}
        ></ComplexEditor>
        <ComplexEditor
          imagin={imagin_1}
          real={real_1}
          line={1}
          onChange={(r, i) => {
            onChange(real_0, imagin_0, r, i);
          }}
        ></ComplexEditor>
      </div>
    </div>
  );
}
