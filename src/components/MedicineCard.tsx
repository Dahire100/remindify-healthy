import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Pill, FileText, Check, X, Package, PackageMinus, PackagePlus, AlertTriangle, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface MedicineCardProps {
  id: string;
  name: string;
  time: string;
  dosage: string;
  instructions?: string;
  frequency?: string;
  status?: "pending" | "taken" | "missed";
  quantity: number;
  refillThreshold: number;
  onDelete: () => void;
  onStatusChange: (id: string, status: "taken" | "missed") => void;
  onQuantityChange: (id: string, newQuantity: number) => void;
  sendSystemNotification?: (title: string, body: string) => boolean;
}

const MedicineCard = ({ 
  id,
  name, 
  time, 
  dosage, 
  instructions = "", 
  frequency = "daily",
  status = "pending",
  quantity,
  refillThreshold,
  onDelete,
  onStatusChange,
  onQuantityChange,
  sendSystemNotification
}: MedicineCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  
  const isLowStock = quantity <= refillThreshold;
  const percentRemaining = Math.min(100, Math.round((quantity / (refillThreshold * 3)) * 100));
  
  // Extract dosage amount for real-time notifications
  const getDosageAmount = () => {
    const match = dosage.match(/(\d+)/);
    return match && match[1] ? parseInt(match[1], 10) : 1;
  };
  
  const dosageAmount = getDosageAmount();
  
  // Calculate doses remaining based on dosage amount
  const dosesRemaining = Math.floor(quantity / dosageAmount);

  const handleTaken = () => {
    // When marking as taken, reduce quantity by exact dosage amount
    if (quantity >= dosageAmount) {
      const newQuantity = quantity - dosageAmount;
      onQuantityChange(id, newQuantity);
      
      // Real-time notification about remaining doses
      if (newQuantity <= refillThreshold && newQuantity > 0) {
        const message = `After taking this dose, you have ${Math.floor(newQuantity/dosageAmount)} doses left. Please refill soon.`;
        
        toast({
          title: `${name} - Running Low`,
          description: message,
          variant: "destructive"
        });
        
        // Send system notification if enabled
        if (sendSystemNotification) {
          sendSystemNotification(`${name} - Running Low`, message);
        }
      } else if (newQuantity <= 0) {
        const message = `This was your last dose! You need to refill immediately.`;
        
        toast({
          title: `${name} - Out of Stock!`,
          description: message,
          variant: "destructive"
        });
        
        // Send system notification if enabled
        if (sendSystemNotification) {
          sendSystemNotification(`${name} - Out of Stock!`, message);
        }
      }
    } else {
      const message = `Not enough ${name} left for a complete dose.`;
      
      toast({
        title: "Insufficient Quantity",
        description: message,
        variant: "destructive"
      });
      
      // Send system notification if enabled
      if (sendSystemNotification) {
        sendSystemNotification("Insufficient Quantity", message);
      }
    }
    onStatusChange(id, "taken");
  };
  
  // Effect to check time and remind about dosage
  useEffect(() => {
    if (status === "pending") {
      // Parse the time string to compare with current time
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0);
      
      // Check if current time is within 5 minutes of reminder time
      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
      const isTimeToTake = timeDiff <= 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (isTimeToTake) {
        const message = `Your dosage is ${dosage}. You have ${dosesRemaining} doses remaining.`;
        
        toast({
          title: `Time to take ${name}`,
          description: message,
          variant: "default"
        });
        
        // Send system notification if enabled
        if (sendSystemNotification) {
          sendSystemNotification(`Time to take ${name}`, message);
        }
      }
    }
  }, [status, time, name, dosage, dosesRemaining, sendSystemNotification]);
  
  return (
    <Card className={cn(
      "p-6 mb-4 backdrop-blur-sm border transition-all duration-300 animate-fadeIn",
      status === "pending" ? "bg-white/80 border-medical-100 hover:border-medical-200" : 
      status === "taken" ? "bg-green-50/90 border-green-200 hover:border-green-300" : 
      "bg-red-50/90 border-red-200 hover:border-red-300"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-full",
            status === "pending" ? "bg-medical-100" : 
            status === "taken" ? "bg-green-100" : 
            "bg-red-100"
          )}>
            <Pill className={cn(
              "w-5 h-5",
              status === "pending" ? "text-medical-600" : 
              status === "taken" ? "text-green-600" : 
              "text-red-600"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              {time} {frequency && <span className="ml-1">({frequency})</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">Dosage: {dosage}</p>
            
            {/* Inventory Information with doses count */}
            <div className="mt-2 flex items-center">
              <Package className={cn(
                "w-4 h-4 mr-1", 
                isLowStock ? "text-amber-500" : "text-medical-500"
              )} />
              <div className="text-sm">
                <span className={cn(
                  isLowStock ? "text-amber-600 font-medium" : "text-medical-600"
                )}>
                  {quantity} left ({dosesRemaining} doses)
                </span>
                {isLowStock && (
                  <span className="ml-2 text-xs text-amber-600">
                    (Refill needed)
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress bar for quantity */}
            <div className="mt-1 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  isLowStock ? "bg-amber-500" : "bg-medical-500"
                )}
                style={{ width: `${percentRemaining}%` }}
              ></div>
            </div>
            
            {expanded && instructions && (
              <div className="mt-2 text-sm text-gray-600 flex items-start">
                <FileText className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                <p>{instructions}</p>
              </div>
            )}
            
            {instructions && (
              <button 
                onClick={() => setExpanded(!expanded)} 
                className="text-xs text-medical-600 mt-1 hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          {status === "pending" ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTaken}
                className="border-green-200 hover:border-green-300 hover:bg-green-50"
                disabled={quantity < dosageAmount}
                title={quantity < dosageAmount ? "Not enough medication left" : "Mark as taken"}
              >
                <Check className="w-4 h-4 text-green-500" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(id, "missed")}
                className="border-red-200 hover:border-red-300 hover:bg-red-50"
              >
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="text-sm flex items-center mb-2">
              {status === "taken" ? (
                <span className="text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-1" /> Taken
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" /> Missed
                </span>
              )}
            </div>
          )}
          
          {/* Inventory control buttons */}
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuantityChange(id, quantity + dosageAmount)}
              className="border-medical-200 hover:border-medical-300"
              title={`Add ${dosageAmount}`}
            >
              <PackagePlus className="w-3 h-3 text-medical-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quantity >= dosageAmount && onQuantityChange(id, quantity - dosageAmount)}
              className="border-medical-200 hover:border-medical-300"
              disabled={quantity < dosageAmount}
              title={`Remove ${dosageAmount}`}
            >
              <PackageMinus className="w-3 h-3 text-medical-600" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            Delete
          </Button>
        </div>
      </div>
      
      {/* Show alert banner when inventory is low */}
      {isLowStock && status === "pending" && (
        <Alert className="mt-3 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 text-sm">Low Inventory Alert</AlertTitle>
          <AlertDescription className="text-amber-700 text-xs">
            You only have {dosesRemaining} {dosesRemaining === 1 ? 'dose' : 'doses'} of {name} left. 
            Consider refilling soon.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Show critical alert when not enough for a full dose */}
      {quantity < dosageAmount && status === "pending" && (
        <Alert className="mt-3 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 text-sm">Insufficient Quantity</AlertTitle>
          <AlertDescription className="text-red-700 text-xs">
            You don't have enough {name} for a complete dose ({dosage}). 
            Please refill immediately.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};

export default MedicineCard;
