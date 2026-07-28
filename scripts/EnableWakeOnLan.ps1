$ErrorActionPreference = 'Stop'

Set-NetAdapterAdvancedProperty `
  -Name 'Ethernet' `
  -RegistryKeyword '*WakeOnMagicPacket' `
  -RegistryValue 1

Set-NetAdapterAdvancedProperty `
  -Name 'Ethernet' `
  -RegistryKeyword 'S5WakeOnLan' `
  -RegistryValue 1

powercfg /deviceenablewake 'Realtek PCIe GbE Family Controller'

Get-NetAdapterAdvancedProperty -Name 'Ethernet' |
  Where-Object {
    $_.RegistryKeyword -in '*WakeOnMagicPacket', 'S5WakeOnLan'
  } |
  Select-Object DisplayName, DisplayValue, RegistryKeyword, RegistryValue |
  Format-Table -AutoSize

powercfg /devicequery wake_armed
