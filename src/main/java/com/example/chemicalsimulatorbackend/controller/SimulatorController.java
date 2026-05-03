// SimulatorController.java
package com.example.chemicalsimulatorbackend.controller;

import com.example.chemicalsimulatorbackend.model.Tank;
import com.example.chemicalsimulatorbackend.service.SimulatorService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
@CrossOrigin(origins = "*")
public class SimulatorController {

    private final SimulatorService simulatorService;

    public SimulatorController(SimulatorService simulatorService) {
        this.simulatorService = simulatorService;
    }

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        Map<String, Object> response = new HashMap<>();

        response.put("processState",    simulatorService.getProcessState());
        response.put("isPaused",        simulatorService.isPaused()); // Повертаємо стан паузи
        response.put("currentRecipe",   simulatorService.getCurrentRecipe());
        response.put("currentStepIndex",simulatorService.getCurrentStepIndex());
        response.put("totalSteps",      simulatorService.getTotalProcessSteps());
        response.put("stepProgress",    simulatorService.getStepProgress());
        response.put("eventLog",        simulatorService.getEventLog());

        response.put("oilTank",      extractTankData(simulatorService.getLeftTank()));
        response.put("lyeTank",      extractTankData(simulatorService.getRightTank()));
        response.put("reactorTank",  extractTankData(simulatorService.getReactorTank()));

        return response;
    }

    @PostMapping("/start")
    public Map<String, String> startProcess(@RequestParam String recipe) {
        simulatorService.startProcess(recipe);
        return Map.of("status", "started", "recipe", recipe);
    }

    @PostMapping("/pause")
    public Map<String, String> togglePause() {
        simulatorService.togglePause();
        return Map.of("status", "paused_toggled");
    }

    @PostMapping("/reset")
    public Map<String, String> resetProcess() {
        simulatorService.resetProcess();
        return Map.of("status", "reset");
    }

    @PostMapping("/tick")
    public void processTick() {
        simulatorService.processTick();
    }

    private Map<String, Object> extractTankData(Tank tank) {
        Map<String, Object> data = new HashMap<>();
        data.put("currentLevel",    tank.getCurrentLevel());
        data.put("heaterOn",        tank.isHeaterOn());
        data.put("mixerOn",         tank.isMixerOn());
        data.put("temperature",     Math.round(tank.getTemperature() * 10.0) / 10.0);
        data.put("targetTemp",      tank.getTargetTemperature());
        data.put("inputValveOpen",  tank.getInputValve().isOpen());
        data.put("outputValveOpen", tank.getOutputValve().isOpen());
        data.put("lowSensor",       tank.isLowLevelSensorTriggered());
        data.put("highSensor",      tank.isHighLevelSensorTriggered());
        return data;
    }
}