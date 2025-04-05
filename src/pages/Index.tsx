import { useState, useEffect } from "react";
import MedicineCard from "@/components/MedicineCard";
import AddReminderForm from "@/components/AddReminderForm";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Package, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Medicine {
  id: string;
  name: string;
  time: string;
  dosage: string;
  instructions: string;
  frequency: string;
  status: "pending" | "taken" | "missed";
  quantity: number;
  refillThreshold: number;
}

const Index = () => {
  const [reminders, setReminders] = useState<Medicine[]>([]);
  const [notificationsPermission, setNotificationsPermission] = useState<NotificationPermission | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationsPermission(permission);
        
        if (permission === "granted") {
          toast({
            title: "Notifications enabled",
            description: "You will now receive system notifications for medicine reminders",
          });
        } else {
          toast({
            title: "Notifications disabled",
            description: "You won't receive system notifications for medicine reminders",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        toast({
          title: "Error enabling notifications",
          description: "Failed to request notification permission",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Notifications not supported",
        description: "Your browser does not support system notifications",
        variant: "destructive",
      });
    }
  };

  const sendSystemNotification = (title: string, body: string) => {
    if ("Notification" in window && notificationsPermission === "granted") {
      try {
        const notification = new Notification(title, {
          body: body,
          icon: "/favicon.ico"
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        return true;
      } catch (error) {
        console.error("Error sending notification:", error);
        return false;
      }
    }
    return false;
  };

  const getDosageAmount = (dosage: string) => {
    const match = dosage.match(/(\d+)/);
    return match && match[1] ? parseInt(match[1], 10) : 1;
  };

  const handleAddReminder = (medicine: Omit<Medicine, "id" | "status">) => {
    const newReminder = {
      ...medicine,
      id: Date.now().toString(),
      status: "pending" as const,
    };
    setReminders((prev) => [...prev, newReminder]);
    toast({
      title: "Reminder added",
      description: `${medicine.name} reminder has been set for ${medicine.time} (${medicine.frequency})`,
    });
    
    sendSystemNotification(
      "Medicine Reminder Added", 
      `${medicine.name} reminder has been set for ${medicine.time}`
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
    toast({
      title: "Reminder deleted",
      description: "The reminder has been removed",
    });
  };

  const handleStatusChange = (id: string, status: "taken" | "missed") => {
    setReminders((prev) => 
      prev.map((reminder) => 
        reminder.id === id ? { ...reminder, status } : reminder
      )
    );
    
    const medicine = reminders.find(r => r.id === id);
    
    if (medicine) {
      const message = status === "taken" 
        ? "Great job! You've marked this medicine as taken." 
        : "You've marked this medicine as missed. Don't forget next time!";
        
      toast({
        title: status === "taken" ? "Medicine taken" : "Medicine missed",
        description: message,
        variant: status === "taken" ? "default" : "destructive",
      });
      
      sendSystemNotification(
        status === "taken" ? `${medicine.name} Taken` : `${medicine.name} Missed`,
        message
      );
    }
  };
  
  const handleQuantityChange = (id: string, newQuantity: number) => {
    setReminders((prev) => 
      prev.map((reminder) => 
        reminder.id === id ? { ...reminder, quantity: newQuantity } : reminder
      )
    );
    
    const medicine = reminders.find(r => r.id === id);
    
    if (medicine) {
      const dosageAmount = getDosageAmount(medicine.dosage);
      const dosesRemaining = Math.floor(newQuantity / dosageAmount);
      
      if (newQuantity <= medicine.refillThreshold && newQuantity > 0) {
        const message = `You only have ${dosesRemaining} ${dosesRemaining === 1 ? 'dose' : 'doses'} of ${medicine.name} left. Consider refilling soon.`;
        
        toast({
          title: "Medicine running low",
          description: message,
          variant: "destructive",
        });
        
        sendSystemNotification(
          `${medicine.name} Running Low`,
          message
        );
      } else if (newQuantity === 0) {
        const message = `You are out of ${medicine.name}. Please refill as soon as possible.`;
        
        toast({
          title: "Medicine depleted",
          description: message,
          variant: "destructive",
        });
        
        sendSystemNotification(
          `${medicine.name} Depleted`,
          message
        );
      }
    }
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      pendingReminders.forEach(reminder => {
        const [hours, minutes] = reminder.time.split(':').map(Number);
        
        if (currentHour === hours && Math.abs(currentMinute - minutes) <= 1) {
          const dosageAmount = getDosageAmount(reminder.dosage);
          const dosesRemaining = Math.floor(reminder.quantity / dosageAmount);
          const message = `Your dosage is ${reminder.dosage}. You have ${dosesRemaining} doses remaining.`;
          
          toast({
            title: `Time to take ${reminder.name}`,
            description: message,
          });
          
          sendSystemNotification(
            `Time to take ${reminder.name}`,
            message
          );
        }
      });
    };
    
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  const pendingReminders = reminders.filter(r => r.status === "pending");
  const takenReminders = reminders.filter(r => r.status === "taken");
  const missedReminders = reminders.filter(r => r.status === "missed");
  
  const lowStockMedicines = reminders.filter(r => {
    const dosageAmount = getDosageAmount(r.dosage);
    const dosesRemaining = Math.floor(r.quantity / dosageAmount);
    return dosesRemaining <= Math.floor(r.refillThreshold / dosageAmount) && r.status === "pending";
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-medical-100">
      <div className="container max-w-4xl py-12">
        <div className="text-center mb-10 animate-fadeIn">
          <p className="text-sm font-medium text-medical-600 mb-2">MEDICINE REMINDER</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Never Miss Your Medicine
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Keep track of your medications, get reminders, and monitor your inventory.
          </p>
          
          {"Notification" in window && (
            <div className="mt-4">
              <Button 
                onClick={requestNotificationPermission}
                className={
                  notificationsPermission === "granted" 
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-medical-500 hover:bg-medical-600"
                }
              >
                <Bell className="w-4 h-4 mr-2" />
                {notificationsPermission === "granted" 
                  ? "Notifications Enabled" 
                  : "Enable System Notifications"}
              </Button>
              {notificationsPermission !== "granted" && (
                <p className="text-xs text-gray-500 mt-2">
                  Enable notifications to receive medicine reminders even when the app is in the background
                </p>
              )}
            </div>
          )}
        </div>

        {lowStockMedicines.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <Package className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Medicine Inventory Alert</AlertTitle>
            <AlertDescription className="text-amber-700">
              You're running low on: {lowStockMedicines.map(med => med.name).join(', ')}. 
              Please refill soon.
            </AlertDescription>
          </Alert>
        )}

        <AddReminderForm onAdd={handleAddReminder} />

        {reminders.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Medication Reminders</h2>
              <div className="text-sm text-gray-600">
                Total: {reminders.length} | Pending: {pendingReminders.length} | Taken: {takenReminders.length} | Missed: {missedReminders.length}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {pendingReminders.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Pending</h3>
              {pendingReminders.map((reminder) => (
                <MedicineCard
                  key={reminder.id}
                  id={reminder.id}
                  name={reminder.name}
                  time={reminder.time}
                  dosage={reminder.dosage}
                  instructions={reminder.instructions}
                  frequency={reminder.frequency}
                  status={reminder.status}
                  quantity={reminder.quantity}
                  refillThreshold={reminder.refillThreshold}
                  onDelete={() => handleDeleteReminder(reminder.id)}
                  onStatusChange={handleStatusChange}
                  onQuantityChange={handleQuantityChange}
                  sendSystemNotification={sendSystemNotification}
                />
              ))}
            </div>
          )}

          {takenReminders.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-green-700 mb-3">Taken</h3>
              {takenReminders.map((reminder) => (
                <MedicineCard
                  key={reminder.id}
                  id={reminder.id}
                  name={reminder.name}
                  time={reminder.time}
                  dosage={reminder.dosage}
                  instructions={reminder.instructions}
                  frequency={reminder.frequency}
                  status={reminder.status}
                  quantity={reminder.quantity}
                  refillThreshold={reminder.refillThreshold}
                  onDelete={() => handleDeleteReminder(reminder.id)}
                  onStatusChange={handleStatusChange}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>
          )}

          {missedReminders.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-red-700 mb-3">Missed</h3>
              {missedReminders.map((reminder) => (
                <MedicineCard
                  key={reminder.id}
                  id={reminder.id}
                  name={reminder.name}
                  time={reminder.time}
                  dosage={reminder.dosage}
                  instructions={reminder.instructions}
                  frequency={reminder.frequency}
                  status={reminder.status}
                  quantity={reminder.quantity}
                  refillThreshold={reminder.refillThreshold}
                  onDelete={() => handleDeleteReminder(reminder.id)}
                  onStatusChange={handleStatusChange}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>
          )}

          {reminders.length === 0 && (
            <div className="text-center py-12 text-gray-500 animate-fadeIn">
              No reminders yet. Add your first medicine reminder above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
