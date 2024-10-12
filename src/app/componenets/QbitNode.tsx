import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { useState } from "react";
import { Qbit } from "../hooks/useCircuit";
import { BlockMath } from "react-katex"; // Importing KaTeX component for rendering LaTeX
import "katex/dist/katex.min.css"; // Import KaTeX CSS for styling

interface QBitNodeData extends Qbit {
  index: number;
  modalVisible: boolean;
  onChange: (real: number, imagin: number) => void;
  [key: string]: unknown; // Ensures that QBitNodeData satisfies the Record<string, unknown> constraint
}

type QBitNode = Node<QBitNodeData, "qbit">;

export default function QBitNode({ data }: NodeProps<QBitNode>) {
  const { real, imagin, index, onChange } = data;

  // State to control editor visibility
  const [editorVisible, setEditorVisible] = useState(false);

  // State to hold temporary LaTeX string and parsed values
  const [latexInput, setLatexInput] = useState(``);
  const [tempReal, setTempReal] = useState(real);
  const [tempImagin, setTempImagin] = useState(imagin);

  // Toggle the visibility of the editor
  const toggleEditor = () => {
    setEditorVisible((prev) => !prev);

    // Set the input values when opening the editor
    if (!editorVisible) {
      setLatexInput(`\\(${real} + ${imagin}i\\)`); // Initialize LaTeX input
    }
  };

  // Handle LaTeX input changes
  const handleLatexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLatexInput(e.target.value);
  };

  // Parse LaTeX input to update real and imaginary values
  const parseLatexToValues = (latex: string) => {
    const regex = /\\\(([^+]+)\s*\+\s*([^i]+)i\\\)/;
    const match = latex.match(regex);
    if (match) {
      const realPart = parseFloat(match[1]);
      const imaginPart = parseFloat(match[2]);
      setTempReal(isNaN(realPart) ? 0 : realPart);
      setTempImagin(isNaN(imaginPart) ? 0 : imaginPart);
    }
  };

  // Handle submission of new values
  const handleSubmit = () => {
    onChange(tempReal, tempImagin);
    setEditorVisible(false); // Close editor after submission
  };

  // Update the temporary values based on LaTeX input
  const handleParse = () => {
    parseLatexToValues(latexInput);
  };

  return (
    <div className="relative w-12 h-12 bg-white">
      <div className="w-12 h-12 border-2 rounded-md flex items-center justify-center">
        [{index}]<Handle type="source" position={Position.Right}></Handle>
      </div>

      <div className="absolute top-0 left-[-160px] w-36 h-12 border-2 bg-white z-10 p-2 flex items-center">
        <div className="flex-1">
          {real} + {imagin}i
        </div>
        {editorVisible && (
          <div className="flex items-center">
            <input
              className="w-48 mr-2 border"
              type="text"
              value={latexInput}
              onChange={handleLatexChange}
              placeholder="Enter LaTeX (e.g., \\( a + bi \\))"
            />
            <button onClick={handleParse}>Parse</button>
            <button onClick={handleSubmit}>Submit</button>
          </div>
        )}
        <button onClick={toggleEditor}>{editorVisible ? "Cancel" : "Edit"}</button>
      </div>

      {editorVisible && (
        <div className="absolute top-14 left-[-160px] w-36 border-2 bg-gray-100 z-20 p-2">
          <BlockMath>{latexInput}</BlockMath> {/* Render LaTeX */}
        </div>
      )}
    </div>
  );
}
