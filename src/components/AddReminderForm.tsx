
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package } from "lucide-react";
import { Label } from "@/components/ui/label";

interface AddReminderFormProps {
  onAdd: (medicine: { 
    name: string; 
    time: string; 
    dosage: string; 
    instructions: string;
    frequency: string;
    quantity: number;
    refillThreshold: number;
  }) => void;
}

const AddReminderForm = ({ onAdd }: AddReminderFormProps) => {
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [quantity, setQuantity] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(5);

  // Update quantity when dosage changes
  useEffect(() => {
    if (dosage) {
      // Try to extract numeric value from dosage
      const match = dosage.match(/(\d+)/);
      if (match && match[1]) {
        // If dosage contains a number (like "2 pills"), update quantity
        const dosageNum = parseInt(match[1], 10);
        // Set quantity to a multiple of the dosage amount
        setQuantity(dosageNum * 15); // Default to 15 days supply
      }
    }
  }, [dosage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && time && dosage) {
      onAdd({ 
        name, 
        time, 
        dosage, 
        instructions, 
        frequency, 
        quantity, 
        refillThreshold 
      });
      setName("");
      setTime("");
      setDosage("");
      setInstructions("");
      setFrequency("daily");
      setQuantity(30);
      setRefillThreshold(5);
    }
  };

  // Calculate a smart refill threshold based on dosage
  useEffect(() => {
    if (dosage) {
      const match = dosage.match(/(\d+)/);
      if (match && match[1]) {
        const dosageNum = parseInt(match[1], 10);
        // Set refill threshold to approximately 5 days supply
        setRefillThreshold(dosageNum * 5);
      }
    }
  }, [dosage]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-lg border border-medical-100 mb-8 animate-slideIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="medicine-name">Medicine Name</Label>
          <Input
            id="medicine-name"
            type="text"
            placeholder="Enter medicine name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-medical-200 focus:border-medical-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="medicine-time">Reminder Time</Label>
          <Input
            id="medicine-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border-medical-200 focus:border-medical-400"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="medicine-dosage">Dosage</Label>
          <Input
            id="medicine-dosage"
            type="text"
            placeholder="e.g., 1 pill, 5ml, etc."
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="border-medical-200 focus:border-medical-400"
          />
          <p className="text-xs text-gray-500">The quantity will be linked to your dosage amount</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select 
            value={frequency} 
            onValueChange={(value) => setFrequency(value)}
          >
            <SelectTrigger className="border-medical-200 focus:border-medical-400">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="morning-evening">Morning & Evening</SelectItem>
              <SelectItem value="as-needed">As Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Add inventory tracking fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="medicine-quantity">
            Current Quantity
            <span className="ml-1 text-xs text-gray-500">(based on dosage)</span>
          </Label>
          <Input
            id="medicine-quantity"
            type="number"
            min="1"
            placeholder="How many do you have?"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="border-medical-200 focus:border-medical-400"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="refill-threshold">
            Refill Alert Threshold
            <span className="ml-1 text-xs text-gray-500">(when to notify)</span>
          </Label>
          <Input
            id="refill-threshold"
            type="number"
            min="1"
            placeholder="When to alert for refill"
            value={refillThreshold}
            onChange={(e) => setRefillThreshold(parseInt(e.target.value) || 0)}
            className="border-medical-200 focus:border-medical-400"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="instructions">Special Instructions</Label>
        <Textarea 
          id="instructions"
          placeholder="Any special instructions (e.g., take with food)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="border-medical-200 focus:border-medical-400"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-medical-500 hover:bg-medical-600 text-white transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Reminder
      </Button>
    </form>
  );
};

export default AddReminderForm;
