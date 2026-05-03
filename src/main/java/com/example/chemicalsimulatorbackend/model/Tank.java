// Tank.java
package com.example.chemicalsimulatorbackend.model;

public class Tank {
    private double currentLevel;
    private final double maxCapacity;

    private boolean heaterOn;
    private boolean mixerOn;

    private double temperature;
    private double targetTemperature;
    private static final double AMBIENT_TEMP  = 20.0;

    // ЗБІЛЬШЕНО ШВИДКІСТЬ НАГРІВУ (було 0.4)
    private static final double HEAT_RATE     = 1.5;
    private static final double COOL_RATE     = 0.3;

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

    public boolean isLowLevelSensorTriggered() { return currentLevel <= 0; }
    public boolean isHighLevelSensorTriggered() { return currentLevel >= maxCapacity; }

    public void simulateTemperature() {
        if (heaterOn && temperature < targetTemperature) {
            temperature = Math.min(temperature + HEAT_RATE, targetTemperature);
        } else if (!heaterOn && temperature > AMBIENT_TEMP) {
            temperature = Math.max(temperature - COOL_RATE, AMBIENT_TEMP);
        }
    }

    public double getCurrentLevel() { return currentLevel; }
    public void changeLevel(double amount) {
        this.currentLevel += amount;
        if (this.currentLevel < 0)           this.currentLevel = 0;
        if (this.currentLevel > maxCapacity) this.currentLevel = maxCapacity;
    }

    public boolean isHeaterOn() { return heaterOn; }
    public void setHeaterOn(boolean heaterOn) { this.heaterOn = heaterOn; }

    public boolean isMixerOn() { return mixerOn; }
    public void setMixerOn(boolean mixerOn) { this.mixerOn = mixerOn; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public double getTargetTemperature() { return targetTemperature; }
    public void setTargetTemperature(double targetTemperature) { this.targetTemperature = targetTemperature; }

    public Valve getInputValve()  { return inputValve; }
    public Valve getOutputValve() { return outputValve; }

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