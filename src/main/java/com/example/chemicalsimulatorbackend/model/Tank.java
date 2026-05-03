// Tank.java
package com.example.chemicalsimulatorbackend.model;

public class Tank {
    private double currentLevel;
    private final double maxCapacity;

    // Обладнання
    private boolean heaterOn;
    private boolean mixerOn;

    // Температура
    private double temperature;         // Поточна температура
    private double targetTemperature;   // Цільова температура (якщо нагрів увімкнено)
    private static final double AMBIENT_TEMP  = 20.0;   // Температура навколишнього середовища
    private static final double HEAT_RATE     = 0.4;    // Нагрів за тік (°C)
    private static final double COOL_RATE     = 0.1;    // Охолодження за тік (°C)

    // Крани
    private Valve inputValve;
    private Valve outputValve;

    public Tank(double maxCapacity) {
        this.maxCapacity   = maxCapacity;
        this.currentLevel  = 0;
        this.heaterOn      = false;
        this.mixerOn       = false;
        this.temperature   = AMBIENT_TEMP;
        this.targetTemperature = AMBIENT_TEMP;
        this.inputValve    = new Valve();
        this.outputValve   = new Valve();
    }

    // --- Датчики рівня ---
    public boolean isLowLevelSensorTriggered() {
        return currentLevel <= 0;
    }

    public boolean isHighLevelSensorTriggered() {
        return currentLevel >= maxCapacity;
    }

    // --- Симуляція температури (викликається кожен тік) ---
    public void simulateTemperature() {
        if (heaterOn && temperature < targetTemperature) {
            temperature = Math.min(temperature + HEAT_RATE, targetTemperature);
        } else if (!heaterOn && temperature > AMBIENT_TEMP) {
            temperature = Math.max(temperature - COOL_RATE, AMBIENT_TEMP);
        }
    }

    // --- Рівень ---
    public double getCurrentLevel() { return currentLevel; }

    public void changeLevel(double amount) {
        this.currentLevel += amount;
        if (this.currentLevel < 0)           this.currentLevel = 0;
        if (this.currentLevel > maxCapacity) this.currentLevel = maxCapacity;
    }

    // --- Нагрівач ---
    public boolean isHeaterOn() { return heaterOn; }
    public void setHeaterOn(boolean heaterOn) { this.heaterOn = heaterOn; }

    // --- Міксер ---
    public boolean isMixerOn() { return mixerOn; }
    public void setMixerOn(boolean mixerOn) { this.mixerOn = mixerOn; }

    // --- Температура ---
    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public double getTargetTemperature() { return targetTemperature; }
    public void setTargetTemperature(double targetTemperature) {
        this.targetTemperature = targetTemperature;
    }

    // --- Крани ---
    public Valve getInputValve()  { return inputValve; }
    public Valve getOutputValve() { return outputValve; }

    // --- Скидання бака ---
    public void reset() {
        this.currentLevel      = 0;
        this.heaterOn          = false;
        this.mixerOn           = false;
        this.temperature       = AMBIENT_TEMP;
        this.targetTemperature = AMBIENT_TEMP;
        this.inputValve.setControlSignal(false);
        this.outputValve.setControlSignal(false);
    }
}
