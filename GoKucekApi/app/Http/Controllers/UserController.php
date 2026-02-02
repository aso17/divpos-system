<?php

namespace App\Http\Controllers;

use App\Models\Ms_user;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Http\Resources\UserResource;
use App\Services\UserService; 
use App\Helpers\CryptoHelper; 

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }
    
    // GET /user
    public function index(Request $request)
    {
        if (!$request->filled('tenant_id')) {
            return response()->json(['message' => 'tenant_id is required'], 422);
        }

        $query = $this->userService->getAllUsers($request->all());

        if (!$query) {
            return response()->json(['message' => 'Invalid tenant'], 403);
        }

        $perPage = (int) ($request->per_page ?? 10);

        if ($request->filled('page')) {
            $users = $query->paginate($perPage);
            return UserResource::collection($users); 
        }

        return UserResource::collection($query->get());
    }


    // GET /user/{id}
    public function show($id)
    {
        return Ms_user::with([
            'role:id,role_name,code',
            'tenant:id,slug,code'
        ])->findOrFail($id);
    }

    // POST /user
  public function store(Request $request)
    {
        
       $request->validate([
        'full_name' => 'required|string|max:100',
        'email'     => 'required|email|unique:Ms_users,email',
        'username'  => 'nullable|string|max:50|unique:Ms_users,username',
        'phone'     => 'nullable|string|max:20',
        'password'  => 'required|min:8',
        'role_id'   => 'required|exists:Ms_roles,id',
        'tenant_id' => 'required|exists:Ms_tenants,id',
        'is_active' => 'nullable|boolean',
        'avatar'    => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);


       $data = [
                'full_name' => strip_tags($request->full_name),
                'email'     => filter_var($request->email, FILTER_SANITIZE_EMAIL),
                'username'  => strip_tags($request->username),
                'phone'     => strip_tags($request->phone),
                'role_id'   => $request->role_id,
                'tenant_id' => $request->tenant_id,
                'is_active' => $request->is_active ?? true,
            ];

        // Default aktif jika tidak dikirim
        $data['is_active'] = $data['is_active'] ?? true;
        // Hash password
        $data['password'] = Hash::make($request->password);

        // Upload avatar (nama unik)
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . time() . '_' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            $data['avatar'] = $path;
        }

        $user = Ms_user::create($data);
        return response()->json([
                'success' => true,
                'message' => 'User berhasil dibuat',
                'datauser'    => $user->load('role'), 
            ], 201);
    }
    // PUT /user/{id}
    public function update(Request $r, $id)
    {
        $user = Ms_user::findOrFail($id);

        $r->validate([
            'full_name' => 'required|string|max:100',
            'email'     => "required|email|unique:Ms_users,email,$id",
            'username'  => "nullable|unique:Ms_users,username,$id",
            'role_id'   => 'nullable|exists:Ms_roles,id',
            'tenant_id' => 'nullable|exists:Ms_tenants,id',
            'avatar'    => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user->update($r->only([
            'full_name','email','username','phone','role_id','tenant_id','is_active'
        ]));

        if ($r->filled('password')) {
            $user->update(['password' => Hash::make($r->password)]);
        }

        // 🔥 HANDLE AVATAR
        if ($r->hasFile('avatar')) {
        
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            // Simpan file baru
            $file = $r->file('avatar');
            $filename = 'avatar_' . time() . '_' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');

            $user->update(['avatar' => $path]);
        }

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diupdate',
            'datauser'    => $user->load('role'), 
        ]);
    }

    // DELETE /user/{id}
    public function destroy($id)
    {
        $user = Ms_user::find($id);
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan atau sudah dihapus'
            ], 404);
        }

        $user->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'User ' . $user->full_name . ' berhasil dihapus',
            'data' => [
                'id' => $id 
            ]
        ], 200);
    }
}
